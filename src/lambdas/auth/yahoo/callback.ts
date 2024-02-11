import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import { log } from '../../../lambda-common/logging.js'
import { get_user_from_login } from '../../../lambda-common/user.js'
import { auth, plus } from '@googleapis/plus'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import fetch, { Headers } from 'node-fetch'
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

        const params = new URLSearchParams();
        params.append('client_id', config.YAHOO_CLIENT_ID);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', 'oob');
        params.append('code', event.queryStringParameters?.code!);

        const token_headers = new Headers()

        token_headers.set('Authorization', 'Basic ' + Buffer.from(`${config.YAHOO_CLIENT_ID}:${config.YAHOO_CLIENT_SECRET}`).toString('base64'))

        const token_response = await fetch("https://api.login.yahoo.com/oauth2/get_token", { method: 'POST', body: params, headers: token_headers });
        const token = await token_response.json() as any


        const profile_headers = new Headers()
        profile_headers.set('Authorization', `Bearer ${token.access_token}`)

        const profile_response = await fetch(`https://api.login.yahoo.com/openid/v1/userinfo`, { headers: profile_headers })
        const profile = await profile_response.json() as any

        try {
            const user_instance = await get_user_from_login(profile.sub, "yahoo", config, profile.name)

            if (!user_instance) {
                return {
                    statusCode: 301,
                    headers: {
                        Location: `/login`,
                    },
                    body: ''
                }
            }

            const jwt_token = jwt.sign({ remoteId: user_instance.remoteId }, config.JWT_SECRET, { expiresIn: 60 * 60 * config.COOKIE_EXPIRY})
            const cookie_string = cookie.serialize("jwt", jwt_token, { maxAge: 60 * 60, httpOnly: true, sameSite: true, path: '/' })

            log(`User Login from ${user_instance.source} ${user_instance.userName} from ${event.headers['X-Forwarded-For']} using ${event.headers['User-Agent']}`)

            const location = !user_instance.new ? `/` : `/user`

            return {
                statusCode: 301,
                headers: {
                    Location: location,
                    'Set-Cookie': cookie_string
                },
                body: ''
            } as APIGatewayProxyResult
        } catch (e) {
            console.log("Error getting user from login")
            console.log(e)
            throw e

        }
    })
}
