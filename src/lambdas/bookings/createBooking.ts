import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanBookIntoEvent } from '../../shared/permissions.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { Model } from 'dynamodb-onetable';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { syncEventToDrive } from '../../lambda-common/drive_sync.js';
import { queueEmail } from '../../lambda-common/email.js';

/*
export const lambdaHandlerfsdf = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        console.log(`Edited event ${lambda_event.body.id}`);
        const EventModel = table.getModel<EventType>('Event')
        console.log(lambda_event.body.event.id)
        const event = await EventModel.get({id: lambda_event.body.event.id})
        if(event) {
            CanEditEvent.throw({user: current_user, event: event})
        await EventModel.update(lambda_event.body.event)
        return {};
        } else {
            throw new Error("Can't find event")
        }
    })
*/

const BookingModel: Model<OnetableBookingType> = table.getModel('Booking')
const EventModel: Model<OnetableEventType> = table.getModel('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

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

            updateParticipantsDates([], booking.participants)

            const newBooking = await BookingModel.create(booking)

            //create historical version
            newBooking.version = newBooking.created.toISOString()
            //@ts-ignore
            await BookingModel.create(newBooking)

            //update timeline
            await EventBookingTimelineModel.update({eventId: booking.eventId}, {set: {events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})'},
            substitutions: {newEvent: [{userId: current_user.id, time: newBooking.created.toISOString()}], emptyList: []}})

            await queueEmail({
                template: "confirmation",
                recipient: current_user,
                event: event as EventType,
                booking: newBooking as BookingType,
                bookingOwner: current_user,
            }, config)

            await syncEventToDrive(event.id, config)

            return {}
        } else {
            throw new Error("Can't find event")
        }    

    })