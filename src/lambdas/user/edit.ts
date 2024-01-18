import { UserType, table } from '../../lambda-common/onetable.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { CanEditUser } from '../../shared/permissions.js';

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
        CanEditUser.throw({ user: current_user })
        const userFields = { userName: lambda_event.body.user.userName, email: lambda_event.body.user.email }
        await UserModel.update({ ...current_user, ...userFields }, { partial: false })
    }
)
