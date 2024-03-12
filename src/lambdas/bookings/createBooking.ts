import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, UserType, table } from '../../lambda-common/onetable.js';
import { CanBookIntoEvent } from '../../shared/permissions.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { Model } from 'dynamodb-onetable';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { queueDriveSync } from '../../lambda-common/drive_sync.js';
import { queueEmail, queueManagerEmails } from '../../lambda-common/email.js';
import { postToDiscord } from '../../lambda-common/discord.js';

const BookingModel: Model<OnetableBookingType> = table.getModel('Booking')
const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')
const UserModel: Model<UserType> = table.getModel<UserType>('User')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const booking = lambda_event.body.booking as BookingType
        const event = await EventModel.get({id: booking.eventId})
        
        if(event && current_user) {
            CanBookIntoEvent.throw({user: current_user, event:event})

            //create latest version
            booking.userId = current_user.id
            booking.version = "latest"
            booking.deleted = false
            //@ts-ignore
            delete booking.fees

            updateParticipantsDates([], booking.participants)

            const newBooking = await BookingModel.create(booking)

            //create historical version
            newBooking.version = newBooking.created.toISOString()
            //@ts-ignore
            await BookingModel.create(newBooking)

            //update timeline
            await EventBookingTimelineModel.update({eventId: booking.eventId}, {set: {events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})'},
            substitutions: {newEvent: [{userId: current_user.id, time: newBooking.created.toISOString()}], emptyList: []}})


            if(!current_user.userName && !current_user.email) {
                await UserModel.update({remoteId: current_user.remoteId, userName: booking.basic.contactName, email: booking.basic.contactEmail})
            } else if(!current_user.userName) {
                await UserModel.update({remoteId: current_user.remoteId, userName: booking.basic.contactName})
            } else if(!current_user.email) {
                await UserModel.update({remoteId: current_user.remoteId, email: booking.basic.contactEmail})
            }

            await queueEmail({
                template: "confirmation",
                recipient: current_user,
                event: event as EventType,
                booking: newBooking as BookingType,
                bookingOwner: current_user,
            }, config)

            await queueManagerEmails({
                template: "managerConfirmation",
                recipient: current_user,
                event: event as EventType,
                booking: newBooking as BookingType,
                bookingOwner: current_user,
            }, config)

            await queueDriveSync(event.id, config)

            await postToDiscord(config, `${newBooking.basic.contactName} (${newBooking.basic.district}) created a booking for event ${event.name}, they have booked ${booking.participants.length} people`)

            return {}
        } else {
            throw new Error("Can't find event")
        }    

    })