import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import { flush_logs, log } from '../../lambda-common/logging.js';
import { get_config } from '../../lambda-common/config.js';
import { get_user_from_event } from '../../lambda-common/user.js';


/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const config = await get_config()
        const current_user = await get_user_from_event(event, config)

        if (current_user) {
            log(`User request, current user is ${current_user.userName} (${current_user.email})`)
            const jwt_token = jwt.sign({ remoteId: current_user.remoteId }, config.JWT_SECRET, { expiresIn: 60 * 60 * config.COOKIE_EXPIRY})
            const cookie_string = cookie.serialize("jwt", jwt_token, { maxAge: 60 * 60, httpOnly: true, sameSite: true, path: '/' })
            await flush_logs()
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    'Set-Cookie': cookie_string
                },
                body: JSON.stringify({ user: current_user }),
            }
        } else {
            log(`User request, current user is annon`)
            await flush_logs()
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: current_user }),
            }
        }
    }
    catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: e instanceof Error ? e.message : 'Something else',
            }),
        };
    }
}
