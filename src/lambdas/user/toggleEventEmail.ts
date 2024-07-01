import { UserType, table } from '../../lambda-common/onetable.js';
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

const UserModel = table.getModel<UserType>('User')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        if(!current_user) throw new Error("No user")
        current_user.eventEmailNopeList = current_user.eventEmailNopeList || []
        if(lambda_event.body.state === false) {
            current_user.eventEmailNopeList.push(lambda_event.body.eventId)
        } else if (lambda_event.body.state === true) {
            current_user.eventEmailNopeList = current_user.eventEmailNopeList.filter((id: string) => id !== lambda_event.body.eventId)
        }
        await UserModel.update(current_user, { partial: false })
    }
)
