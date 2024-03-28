import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import { auth } from '@googleapis/plus'
import { warm } from '../../../lambda-common/warmer.js';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => { //@ts-ignore
    return lambda_wrapper_raw(event, async (config) => {

        await warm(["function_auth_facebook_callback"])

        console.log(event)

        const url = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${config.FACEBOOK_CLIENT_ID}&redirect_uri=${config.BASE_URL}api/auth/facebook/callback&state=123&scope=public_profile`

        return {
            statusCode: 301,
            headers: {
                Location: url,
            },
            body: ''
        }
    })
}
