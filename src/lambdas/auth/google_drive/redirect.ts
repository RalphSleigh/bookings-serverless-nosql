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

        console.log(event)

        const oauth2Client = new auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET,
            `${config.BASE_URL}api/auth/google_drive/callback`
        );

        // generate a url that asks permissions for Blogger and Google Calendar scopes
        const scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file'
        ];

        const url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'offline',

            // If you only need one scope you can pass it as a string
            scope: scopes
        });

        return {
            statusCode: 301,
            headers: {
                Location: url,
            },
            body: ''
        }
    })
}