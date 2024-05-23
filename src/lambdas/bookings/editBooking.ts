import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanEditBooking, CanEditEvent, CanEditOwnBooking, PermissionError } from '../../shared/permissions.js';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { queueDriveSync } from '../../lambda-common/drive_sync.js';
import { queueEmail, queueManagerEmails } from '../../lambda-common/email.js';
import { postToDiscord } from '../../lambda-common/discord.js';
import { diffString } from 'json-diff';
import { log } from '../../lambda-common/logging.js';

const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')
const EventModel = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const newData = lambda_event.body.booking
        const existingLatestBooking = await BookingModel.get({ eventId: newData.eventId, userId: newData.userId, version: "latest" }) as BookingType
        const event = await EventModel.get({ id: existingLatestBooking?.eventId })

        if (existingLatestBooking && event && current_user) {
            const isOwnBooking = existingLatestBooking.userId === current_user.id
            const permissionData = { user: current_user, event: event, booking: existingLatestBooking }
            if (CanEditBooking.if(permissionData) || CanEditOwnBooking.if(permissionData)) {
                console.log("BEGINNING EDIT BOOKING")
                updateParticipantsDates(existingLatestBooking.participants, newData.participants)
                delete newData.fees

                const newLatest = await BookingModel.update({ ...existingLatestBooking, ...newData, deleted: false }, { partial: false })
                const newVersion = await BookingModel.create({ ...newLatest, version: newLatest.updated.toISOString() })

                EventBookingTimelineModel.update({ eventId: newVersion.eventId }, {
                    set: { events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})' },
                    substitutions: { newEvent: [{ userId: newVersion.userId, time: newLatest.updated.toISOString() }], emptyList: [] }
                })

                console.log(`Edited booking ${newData.eventId}-${newData.userId}`);
                if (isOwnBooking) {
                    console.log("BEGINNING EMAIL")
                    await queueEmail({
                        template: "edited",
                        recipient: current_user,
                        event: event as EventType,
                        booking: newLatest as BookingType,
                        bookingOwner: current_user,
                    }, config)
                    console.log("END INDIVIUAL EMAIL BEGIN MANAGERS")
                    await queueManagerEmails({
                        template: "managerBookingUpdated",
                        recipient: current_user,
                        event: event as EventType,
                        booking: newLatest as BookingType,
                        bookingOwner: current_user,
                    }, config)

                    console.log("END EMAIL BEGIN DISCORD")
                    const existingLatestBookingDiscord = {...existingLatestBooking, participants: existingLatestBooking.participants.map(p => ({...p, name: p.basic.name}))}
                    //@ts-ignore
                    const newLatestBookingDiscord = {...newVersion, participants: newVersion.participants.map(p => ({...p, name: p.basic.name}))}

                    const diffOutput = newLatestBookingDiscord.participants.length > 200 ? diffString(existingLatestBookingDiscord, newLatestBookingDiscord, { outputKeys: ['name'], color: false, maxElisions: 1, excludeKeys: ['created', 'updated', 'version'] })
                        .split("\n")
                        .slice(1, -2)
                        .filter(s => !s.includes("entries)"))
                        .map(s => s.includes("name") ? s : s.replace(/(.*\+.*\")(.*)\"/g, '$1***"').replace(/(.*\-.*\")(.*)\"/g, '$1***"'))
                        .join("\n") : "Too many participants to display differences"

                    console.log(diffOutput)

                    await postToDiscord(config, `${newVersion.basic.contactName} (${newVersion.basic.district}) edited their booking for event ${event.name}, they have booked ${newVersion.participants.length} people (previously ${existingLatestBooking.participants.length})`)
                    if (newVersion.participants.length === existingLatestBooking.participants.length) await postToDiscord(config, "```" + diffOutput + "```")
                    console.log("END DISCORD")    
                }
                console.log("BEGINNING DRIVE SYNC")
                await queueDriveSync(event.id, config)
                console.log("END DRIVE SYNC")
                console.log("END EDIT BOOKING")
                return {};
            } else {
                throw new PermissionError("User can't edit booking")
            }
        } else {
            throw new Error("Can't find booking or event")
        }
    })