import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import cookie from 'cookie'
import { flush_logs, log } from '../../lambda-common/logging.js';
import {serializeError } from 'serialize-error';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const cookie_string = cookie.serialize("jwt", "", { maxAge: 60 * 60, httpOnly: true, sameSite: true, path: '/' })

        log(`User logged out ${event.headers['X-Forwarded-For']} using ${event.headers['User-Agent']}`)

        await flush_logs()
        return {
            statusCode: 303,
            headers: {
                'Location': '/',
                'Set-Cookie': cookie_string
            },
            body:''
        }
    }
    catch (e) {
        log(`General failure in ${context.functionName }`)
        log(serializeError(e))
        await flush_logs()
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: e instanceof Error ? e.message : 'Something else',
            }),
        };
    }
}
