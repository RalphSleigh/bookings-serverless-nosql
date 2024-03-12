import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, EventType, OnetableEventType, table } from '../../../lambda-common/onetable.js';
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

const EventModel = table.getModel<OnetableEventType>('Event')
const BookingModel = table.getModel<BookingType>('Booking')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event) {
            CanManageEvent.throw({ user: current_user, event: event })
            const bookings = await BookingModel.find({ sk: { begins: `event:${event.id}:version:latest` } }) as BookingType[]
            const filtered = filterDataByRoles(event, bookings, current_user!)
            return { bookings: filtered };
        } else {
            throw new Error("Can't find event")
        }
    }
)
