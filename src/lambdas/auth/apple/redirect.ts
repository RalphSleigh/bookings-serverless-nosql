import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import appleSignin from 'apple-signin-auth';

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



        // OR const appleSignin = require('apple-signin-auth');
        // OR import { getAuthorizationUrl } from 'apple-signin-auth';

        const options = {
            clientID: config.APPLE_CLIENT_ID,
            redirectUri: `${config.BASE_URL}api/auth/apple/callback`,
            scope: "name email",
            responseMode: "form_post",
        } as {
            clientID: string;
            redirectUri: string;
            responseMode?: 'query' | 'fragment' | 'form_post';
            state?: string;
            scope?: string;
          }

        const authorizationUrl = appleSignin.getAuthorizationUrl(options);

        return {
            statusCode: 301,
            headers: {
                Location: authorizationUrl,
            },
            body: ''
        }
    })
}
