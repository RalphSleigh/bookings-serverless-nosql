    import { Model } from 'dynamodb-onetable';
    import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
    import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
    import { CanDeleteBooking, CanEditBooking, CanEditEvent } from '../../shared/permissions.js';
    import { updateParticipantsDates } from '../../lambda-common/util.js';
    import { syncEventToDrive } from '../../lambda-common/drive_sync.js';
    
    const BookingModel = table.getModel<OnetableBookingType>('Booking')
    const EventModel = table.getModel<OnetableEventType>('Event')
    const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')
    
    export const lambdaHandler = lambda_wrapper_json(
        async (lambda_event, config, current_user) => {
    
            const eventId = lambda_event.body.booking.eventId
            const userId = lambda_event.body.booking.userId
            //@ts-ignore
            const existingLatestBooking = await BookingModel.get({eventId: eventId, userId: userId, version: "latest" }) as BookingType
            
            const event = await EventModel.get({id: existingLatestBooking?.eventId})
    
            if(existingLatestBooking && event) {
                CanDeleteBooking.throw({user: current_user, event: event, booking: existingLatestBooking})
                //const version = new Date()
                const newLatest = await BookingModel.update({...existingLatestBooking, deleted: true}, {partial: false})
                //@ts-ignore
                const newVersion = await BookingModel.create({...newLatest, version: newLatest.updated.toISOString()})
                
                EventBookingTimelineModel.update({eventId: newVersion.eventId}, {set: {events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})'},
                substitutions: {newEvent: [{userId: newVersion.userId, time: newLatest.updated.toISOString()}], emptyList: []}})
                console.log(`Edited booking ${eventId}-${userId}`);    
                await syncEventToDrive(event.id, config)
                return {};
            } else {
                throw new Error("Can't find booking or event")
            }
        })