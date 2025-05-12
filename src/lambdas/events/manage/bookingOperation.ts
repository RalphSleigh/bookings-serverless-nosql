import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, EventType, OnetableBookingType, OnetableEventType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanCreateRole, CanManageVillages, CanWriteMoney } from '../../../shared/permissions.js';
import { admin, auth } from '@googleapis/admin';
import { BookingOperationType } from '../../../shared/computedDataTypes.js';
import { Jsonify } from 'type-fest'
import { postToDiscord } from '../../../lambda-common/discord.js';
import { addVersionToBooking } from '../../../lambda-common/util.js';

const EventModel = table.getModel<OnetableEventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')
const UserModel: Model<UserType> = table.getModel<UserType>('User')
const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event && current_user) {
            const booking = await BookingModel.get({ eventId: lambda_event.pathParameters?.id, userId: lambda_event.pathParameters?.userId, version: "latest" })
            if (booking) {
                const operation: BookingOperationType = lambda_event.body.operation
                console.log("Operation", JSON.stringify(operation))
                switch (operation.type) {
                    case "addPayment":
                        CanWriteMoney.throw({ user: current_user, event: event })
                        const fees = [{ type: "payment", value: operation.value, date: new Date().toISOString(), description: operation.description, userId: current_user.id }] as Jsonify<OnetableBookingType["fees"][0]>[]
                        await BookingModel.update({ eventId: booking.eventId, userId: booking.userId, version: "latest" },
                            {
                                set: { fees: 'list_append(if_not_exists(fees, @{emptyList}), @{newFees})' },
                                substitutions: { emptyList: [], newFees: fees }
                            })

                        await postToDiscord(config, `${current_user.userName} added a payment to booking ${booking.basic.district || booking.basic.contactName} of ${currency(operation.value)} (${operation.description})`)

                        return { message: "Payment added" }
                    case "addAdjustment":
                        CanWriteMoney.throw({ user: current_user, event: event })
                        const adjustmentFees = [{ type: "adjustment", value: operation.value, date: new Date().toISOString(), description: operation.description, userId: current_user.id }] as Jsonify<OnetableBookingType["fees"][0]>[]
                        await BookingModel.update({ eventId: booking.eventId, userId: booking.userId, version: "latest" },
                            {
                                set: { fees: 'list_append(if_not_exists(fees, @{emptyList}), @{newFees})' },
                                substitutions: { emptyList: [], newFees: adjustmentFees }
                            })

                        await postToDiscord(config, `${current_user.userName} added an adjustment to booking ${booking.basic.district || booking.basic.contactName} of ${currency(operation.value)} (${operation.description})`)

                        return { message: "Adjustment added" }
                    case "removeFeeItem":
                        CanWriteMoney.throw({ user: current_user, event: event })
                        const newFees = booking.fees.filter(fee => fee.date.toISOString() !== operation.date).map(f => { return { ...f, date: f.date.toISOString() } })
                        await BookingModel.update({ eventId: booking.eventId, userId: booking.userId, version: "latest" },
                            {
                                set: { fees: newFees }
                            })

                        await postToDiscord(config, `${current_user.userName} deleted a payment/adjustment from booking ${booking.basic.district} (TODO: Figure out what)`)

                        return { message: "Fee removed" }
                    case "assignVillage":
                        CanManageVillages.throw({ user: current_user, event: event })
                        await addVersionToBooking(event as EventType, booking as BookingType, { village: operation.village })
                        return { message: "Village assigned" }
                    case "unassignVillage":
                        CanManageVillages.throw({ user: current_user, event: event })
                        await addVersionToBooking(event as EventType, booking as BookingType, { village: "" })
                        return { message: "Village unassigned" }
                    default:
                        throw new Error("Invalid operation")
                }
            } else {
                throw new Error("Can't find booking")
            }
        } else {
            throw new Error("Can't find event")
        }
    })


const currency = c => c.toLocaleString(undefined, { style: "currency", currency: "GBP" })