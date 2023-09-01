import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, table } from '../../lambda-common/onetable.js';
import { CanBookIntoEvent } from '../../shared/permissions.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { Model } from 'dynamodb-onetable';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { syncEventToDrive } from '../../lambda-common/drive_sync.js';

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
const EventModel: Model<EventType> = table.getModel('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const booking = lambda_event.body.booking
        
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
            EventBookingTimelineModel.update({eventId: booking.eventId}, {set: {events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})'},
            substitutions: {newEvent: [{userId: current_user.id, time: newBooking.created.toISOString()}], emptyList: []}})

            syncEventToDrive(event.id, config)

            return {}
        } else {
            throw new Error("Can't find event")
        }    
        /*
        console.log("Booing create call happened creating")
        let newBooking = lambda_event.body as any;
        newBooking.guestUUID = ""
        newBooking.userId = newBooking.userId || current_user.id;
        newBooking.maxParticipants = newBooking.participants.length;
        newBooking.participants.forEach(p => {
            delete p.internalExtra
        });

        let booking = await db.booking.create(newBooking, {
            include: [{
                association: 'participants'
            }]
        })

        booking = await db.booking.findOne({ where: { id: booking.id }, include: [{ model: db.participant }, { model: db.event }] }) as BookingModel

        console.log(`Created new booking id ${booking.id} for ${booking.userName}`);

        const email = get_email_client(config)
        const fees = feeFactory(booking.event);

        await postToDiscord(config, `${current_user.userName} (${booking.district}) created a booking for event ${booking.event!.name}, they have booked ${booking.participants!.length} people`)

        const emailData: any = booking.get({ plain: true });
        emailData.editURL = config.BASE_URL + "/event/" + emailData.eventId + "/book";
        emailData.user = current_user;
        await email.single(booking.userEmail, confirmation, emailData);
        await email.toManagers(manager_booking_created, emailData);

        return { bookings: [booking] }
        */
    })