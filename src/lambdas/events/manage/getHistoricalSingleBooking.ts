import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, EventType, OnetableBookingType, OnetableEventType, table } from '../../../lambda-common/onetable.js';
import { filterDataByRoles } from '../../../lambda-common/roles.js';
import { CanManageEvent } from '../../../shared/permissions.js';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
    const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
    if(!event) {
        throw new Error("Can't find event")
    }
    CanManageEvent.throw({ user: current_user, event: event })
    const userId = lambda_event.pathParameters?.userId
    const bookings = await BookingModel.find({userIdVersion: {begins: userId}}, {index:'ls1'}) as [BookingType]
    const bookingsForEvent = bookings.filter(b => b.eventId === event.id).filter(b => b.version !== "latest").sort((a, b) => a.created - b.created)
    //ts-ignore
    const filtered = filterDataByRoles(event, bookingsForEvent, current_user!)
    return { bookings: filtered };
    }
)
