import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import { auth } from '@googleapis/plus'

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
    return lambda_wrapper_raw(async (config) => {

        const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${config.BASE_URL}api/auth/microsoft/callback&response_mode=query&scope=openid profile email&state=12345&prompt=select_account`

        return {
            statusCode: 301,
            headers: {
                Location: url,
            },
            body: ''
        }

    })
}
