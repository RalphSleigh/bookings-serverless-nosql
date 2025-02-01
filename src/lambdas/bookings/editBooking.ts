import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanEditBooking, CanEditEvent, CanEditOwnBooking, PermissionError } from '../../shared/permissions.js';
import { addVersionToBooking, updateParticipantsDates } from '../../lambda-common/util.js';
import { queueDriveSync } from '../../lambda-common/drive_sync.js';
import { queueEmail, queueManagerEmails } from '../../lambda-common/email.js';
import { postToDiscord } from '../../lambda-common/discord.js';
import { diffString } from 'json-diff';
import { log } from '../../lambda-common/logging.js';
import { diff } from 'json-diff-ts';

const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')
const EventModel = table.getModel<OnetableEventType>('Event')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const newData = lambda_event.body.booking as Partial<BookingType>
        const notify = lambda_event.body.notify
        const existingLatestBooking = await BookingModel.get({ eventId: newData.eventId, userId: newData.userId, version: "latest" }) as BookingType
        const event = await EventModel.get({ id: existingLatestBooking?.eventId })

        if (existingLatestBooking && event && current_user) {
            const isOwnBooking = existingLatestBooking.userId === current_user.id
            const permissionData = { user: current_user, event: event, booking: existingLatestBooking }
            if (CanEditBooking.if(permissionData) || CanEditOwnBooking.if(permissionData)) {
                console.log("BEGINNING EDIT BOOKING")

                delete newData.fees
                delete newData.village
                const newLatest = await addVersionToBooking(existingLatestBooking, newData)

                console.log(`Edited booking ${newData.eventId}-${newData.userId}`);
                if (isOwnBooking || notify) {
                    console.log("BEGINNING EMAIL")
                    if (isOwnBooking) {
                        await queueEmail({
                            template: "edited",
                            recipient: current_user,
                            event: event as EventType,
                            booking: newLatest as BookingType,
                            bookingOwner: current_user,
                        }, config)
                    } else {
                        const users = await table.getModel('User').scan()
                        const bookingOwner = users.find(u => u.id === newLatest.userId)
                        await queueEmail({
                            template: "edited",
                            recipient: bookingOwner,
                            event: event as EventType,
                            booking: newLatest as BookingType,
                            bookingOwner: bookingOwner,
                        }, config)
                    }
                    console.log("END INDIVIUAL EMAIL BEGIN MANAGERS")
                    await queueManagerEmails({
                        template: "managerBookingUpdated",
                        recipient: current_user,
                        event: event as EventType,
                        booking: newLatest as BookingType,
                        bookingOwner: current_user,
                    }, config)

                    console.log("END EMAIL BEGIN DISCORD")
                    try {
                        //@ts-ignore
                        const discordDiffString = generateDiscordDiff(existingLatestBooking, newLatest)
                        console.log(discordDiffString)

                        if (discordDiffString !== "") {
                            if (isOwnBooking) {
                                await postToDiscord(config, `${newLatest.basic.contactName} (${newLatest.basic.district}) edited their booking for event ${event.name}, they have booked ${newLatest.participants.length} people (previously ${existingLatestBooking.participants.length})`)
                            } else {
                                await postToDiscord(config, `${current_user.userName} edited booking ${newLatest.basic.contactName} (${newLatest.basic.district}) for event ${event.name}, they have booked ${newLatest.participants.length} people (previously ${existingLatestBooking.participants.length})`)
                            }

                            await postToDiscord(config, "```" + discordDiffString + "```")
                        }
                        console.log("END DISCORD")
                    } catch (e) {
                        console.error("Error in discord posting")
                        console.error(e)
                    }
                } else {
                    console.log("Not notifying user or discord")
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

const generateDiscordDiff: (oldBooking: BookingType, newBooking: BookingType) => string = (oldBooking, newBooking) => {
    const updateString = (updateItem, stack) => {
        if (updateItem.changes) {
            updateItem.changes.forEach(c => {
                updateString(c, [...stack, updateItem])
            })
            return
        }
        if (["version", "created", "updated"].includes(updateItem.key)) return


        const capitalise = (string) => {
            return string[0].toUpperCase() + string.slice(1).toLowerCase()
        }

        const updateType = typeof (updateItem.value) === "boolean" ? "Update" : capitalise(updateItem.type)
        const chain = [...stack, updateItem].map(u => u.key).join(" -> ")
        const string = `${updateType}: ${chain}`
        updateStrings.push(string)
    }

    const updateStrings: string[] = []

    const existingLatestBookingDiscord = { ...oldBooking, participants: oldBooking.participants.map(p => ({ ...p, name: p.basic.name })) }
    //@ts-ignore
    const newLatestBookingDiscord = { ...newBooking, participants: newBooking.participants.map(p => ({ ...p, name: p.basic.name })) }

    const updates = diff(existingLatestBookingDiscord, newLatestBookingDiscord, { embeddedObjKeys: { participants: 'name' } })
    updates.forEach(u => {
        updateString(u, [])
    });

    return updates.length > 0 ? updateStrings.join("\n") : ""

}