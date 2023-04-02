import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw, user } from '../../../../lambda-common'
import { Op } from 'sequelize';
import { auth } from '@googleapis/plus'
import { is_warmer_event, warm } from '../../../../lambda-common/warmer';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {//@ts-ignore
    return lambda_wrapper_raw(async (db, config) => {

        if(is_warmer_event(event)) return {}

        await warm(["function_auth_yahoo_callback"])

        const url = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${config.YAHOO_CLIENT_ID}&redirect_uri=${config.BASE_URL}api/auth/yahoo/callback&response_type=code`
        return {
            statusCode: 301,
            headers: {
                Location: url,
            },
            body: ''
        }

        /*
        const oauth2Client = new auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET,
            `${config.BASE_URL}api/auth/google/callback`
        );

        // generate a url that asks permissions for Blogger and Google Calendar scopes
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ];

        const url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'online',

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
        */
    })
}
