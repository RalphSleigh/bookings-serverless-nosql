import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, table } from '../../lambda-common/onetable.js';
import { CanEditBooking, CanEditEvent } from '../../shared/permissions.js';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { syncEventToDrive } from '../../lambda-common/drive_sync.js';

const BookingModel: Model<OnetableBookingType> = table.getModel('Booking')
const EventModel: Model<EventType> = table.getModel('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const newData = lambda_event.body.booking
        //@ts-ignore
        const existingLatestBooking = await BookingModel.get({eventId: newData.eventId, userId: newData.userId, version: "latest" }) as BookingType
        
        const event = await EventModel.get({id: existingLatestBooking?.eventId})

        if(existingLatestBooking && event) {
            CanEditBooking.throw({user: current_user, event: event, booking: existingLatestBooking})

            updateParticipantsDates(existingLatestBooking.participants, newData.participants)

            //const version = new Date()
            const newLatest = await BookingModel.update({...existingLatestBooking, ...newData}, {partial: false})
            //@ts-ignore
            const newVersion = await BookingModel.create({...newLatest, version: newLatest.updated.toISOString()})
            
            EventBookingTimelineModel.update({eventId: newVersion.eventId}, {set: {events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})'},
            substitutions: {newEvent: [{userId: newVersion.userId, time: newLatest.updated.toISOString()}], emptyList: []}})

            console.log(`Edited booking ${newData.eventId}-${newData.userId}`);

            await syncEventToDrive(event.id, config)
            return {};
        } else {
            throw new Error("Can't find booking or event")
        }
    })


/* export const lambdaHandler = lambda_wrapper_json([edit_booking, book_into_organisation],
    async (lambda_event, db, config, current_user) => {

        delete lambda_event.body.internalExtra; //delete the internal extra so user can't update.
        delete lambda_event.body.payments
        lambda_event.body.participants.forEach(p => {
            delete p.internalExtra
        });

        let booking = await db.booking.findOne({ where: { id: lambda_event.body.id }, include: [{ model: db.event }] }) as BookingModel

        if (!booking) throw new Error("booking not found")

        if (moment().isBefore(booking.event!.bookingDeadline)) {
            lambda_event.body.maxParticipants = lambda_event.body.participants.length
        } else {
            lambda_event.body.maxParticipants = Math.max(booking.maxParticipants || 0, lambda_event.body.participants.length);
        }
        await booking.update(lambda_event.body)//this ignores partitipants!
        booking = await db.booking.findOne({ where: { id: booking.id }, include: [{ model: db.participant }] }) as BookingModel

        const previous_participant_count = booking.participants?.length

        await updateAssociation(db, booking, 'participants', db.participant, lambda_event.body.participants)
        booking = await db.booking.findOne({ where: { id: lambda_event.body.id }, include: [{ model: db.participant }, { model: db.payment }, { model: db.event }] }) as BookingModel
        console.log(`User ${current_user.userName} Editing Booking id ${booking!.id}`);

        

        if (current_user.id === booking.userId) {
            const email = get_email_client(config)
            const fees = feeFactory(booking.event);
            const emailData = booking.get({ plain: true });
            //@ts-ignore
            emailData.editURL = config.BASE_URL + '/' + (emailData.userId === 1 ? "guestUUID/" + emailData.eventId + "/" + emailData.guestUUID : "event/" + emailData.eventId + "/book");
            emailData.user = current_user;
            await email.single(booking.userEmail, updated, emailData);
            await email.toManagers(managerBookingUpdated, emailData);

            await postToDiscord(config, `${current_user.userName} (${booking.district}) edited their booking for event ${booking.event!.name}, they have booked ${booking.participants!.length} people (previously ${previous_participant_count})`)
        }

        return { bookings: [booking] }
    })
 */