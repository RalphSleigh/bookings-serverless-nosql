import { EventType, UserType, table } from '../../lambda-common/onetable.js';
import { CanManageEvent } from '../../shared/permissions.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';

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
const UserModel = table.getModel<UserType>('User')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({id: lambda_event.pathParameters?.eventId})
        if(event) {
            CanManageEvent.throw({user: current_user, event: event})
            const users = await UserModel.scan()
            return { users }
        } else {
            throw new Error("Can't list Users")
        }
    }
)
