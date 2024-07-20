import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json, lambda_wrapper_raw } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Jsonify } from 'type-fest';
import Stripe from 'stripe';
import { postToDiscord } from '../../lambda-common/discord.js';

const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')

export const lambdaHandler = async (lambda_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => { //@ts-ignore
    return lambda_wrapper_raw(lambda_event, async (config) => {

        const stripe = new Stripe(config.STRIPE_SECRET_KEY)

        const sigHeader = lambda_event.headers['Stripe-Signature'] || lambda_event.headers['stripe-signature']

        console.log(lambda_event.body)

        const event = stripe.webhooks.constructEvent(
            lambda_event.body!,
            sigHeader!,
            config.STRIPE_WEBHOOK_SECRET
          );

        if(event.type === 'payment_intent.succeeded'){
            const paymentIntent = event.data.object;
            if(!paymentIntent.metadata.eventId || !paymentIntent.metadata.userId) return { statusCode: 200 }

            const booking = await BookingModel.get({ eventId: paymentIntent.metadata.eventId, userId: paymentIntent.metadata.userId, version: "latest" }) as BookingType
            if(booking){

                if(paymentIntent.metadata.donate === "true") {
                    const adjustment = [{ type: "adjustment", value: 5, date: new Date().toISOString(), description: "Extra donation", userId: paymentIntent.metadata.userId }] as Jsonify<OnetableBookingType["fees"][0]>[]
                    await BookingModel.update({ eventId: booking.eventId, userId: booking.userId, version: "latest" },
                        {
                            set: { fees: 'list_append(if_not_exists(fees, @{emptyList}), @{newFees})' },
                            substitutions: { emptyList: [], newFees: adjustment }
                        })
                }

                const fees = [{ type: "payment", value: paymentIntent.amount_received/100, date: new Date().toISOString(), description: "Payment from Stripe", userId: paymentIntent.metadata.userId }] as Jsonify<OnetableBookingType["fees"][0]>[]
                await BookingModel.update({ eventId: booking.eventId, userId: booking.userId, version: "latest" },
                            {
                                set: { fees: 'list_append(if_not_exists(fees, @{emptyList}), @{newFees})' },
                                substitutions: { emptyList: [], newFees: fees }
                            })

                await postToDiscord(config, `Stripe payment of £${paymentIntent.amount_received/100} received from booking ${booking.basic.contactName} (${booking.basic.district ? booking.basic.district : "Individual"})`)
            }
        }
        return { statusCode: 200 }
    })
}

