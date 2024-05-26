import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, EventBookingTimelineType, EventType, JsonBookingType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanEditBooking, CanEditEvent, CanEditOwnBooking, PermissionError } from '../../shared/permissions.js';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { queueDriveSync } from '../../lambda-common/drive_sync.js';
import { queueEmail, queueManagerEmails } from '../../lambda-common/email.js';
import { postToDiscord } from '../../lambda-common/discord.js';
import { diffString } from 'json-diff';
import { log } from '../../lambda-common/logging.js';
import { getFee } from '../../shared/fee/fee.js';
import Stripe from 'stripe';

const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')
const EventModel = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        if (!current_user) throw new Error("User not found")
        const eventId = lambda_event.pathParameters?.id
        const event = await EventModel.get({ id: eventId })
        const booking = await BookingModel.get({ eventId: eventId, userId: current_user.id, version: "latest" }) as BookingType

        const fees = getFee(event)
        const feeLines = fees.getFeeLines(event, booking)

        let totalOutstanding = 0

        for (const feeLine of feeLines) {
            totalOutstanding += feeLine.values[0]
        }

        for (const payment of booking.fees) {
            if (payment.type === "payment") {
                totalOutstanding -= payment.value
            }
            if (payment.type === "adjustment") {
                totalOutstanding += payment.value
            }
        }

        console.log(`Total outstanding: ${totalOutstanding}`)

        const stripe = new Stripe(config.STRIPE_SECRET_KEY)

        const session = await stripe!.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `${event.name} booking for ${booking.basic.contactName}`,
                            description: feeLines.map(f => f.description).join(", ") + `, ${fees.getPaymentReference(booking as unknown as JsonBookingType)}`,
                        },
                        unit_amount: totalOutstanding * 100,
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: `${config.BASE_URL}event/${event.id}/thanks?payment=success`,
            cancel_url: `${config.BASE_URL}event/${event.id}/thanks?payment=cancel`,
            payment_intent_data: {
                metadata: {
                    eventId: event.id,
                    userId: current_user.id,
                }
            }
        });

        return {
            statusCode: 302,
            headers: {
                Location: session.url,
            }
        }

    })