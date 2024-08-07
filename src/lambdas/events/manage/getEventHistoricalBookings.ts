import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, EventType, table } from '../../../lambda-common/onetable.js';
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

const EventModel = table.getModel<EventType>('Event')
const BookingModel = table.getModel<BookingType>('Booking')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
    const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
    CanManageEvent.throw({ user: current_user, event: event })
    const bookings = await BookingModel.find({sk: {begins: `event:${lambda_event.pathParameters?.id}`}}) as [BookingType]
    //ts-ignore
    const bookingsBeforeTimestamp = bookings.filter(b => b.version !== "latest" && Date.parse(b.version) <= parseInt(lambda_event.pathParameters!.timestamp!))
    bookingsBeforeTimestamp.sort((a,b) => Date.parse(b.version) - Date.parse(a.version))
    const seenUsers = new Set()
    const latestBookingsBeforeTimestamp = bookingsBeforeTimestamp.filter(b => {
        if(seenUsers.has(b.userId)) return false
        seenUsers.add(b.userId)
        return true
    })
    const filtered = filterDataByRoles(event, latestBookingsBeforeTimestamp, current_user!)
    return { bookings: filtered };
    }
)
