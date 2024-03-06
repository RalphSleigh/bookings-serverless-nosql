import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import { log } from '../../../lambda-common/logging.js'
import { get_user_from_login } from '../../../lambda-common/user.js'
import { auth, plus } from '@googleapis/plus'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import fetch, { Headers } from 'node-fetch'
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
        console.log(event.body)
        const data = JSON.parse(event.body!)

        const clientSecret = appleSignin.getClientSecret({
            clientID: config.APPLE_CLIENT_ID,
            teamID: config.APPLE_TEAM_ID, // Apple Developer Team ID.
            privateKey: config.APPLE_CLIENT_SECRET, // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
            keyIdentifier: config.APPLE_KEY_ID, // identifier of the private key.
            // OPTIONAL
            expAfter: 15777000, // Unix time in seconds after which to expire the clientSecret JWT. Default is now+5 minutes.
        });

        const options = {
            clientID: config.APPLE_CLIENT_ID, // Apple Client ID
            redirectUri: `${config.BASE_URL}api/auth/apple/callback`, // use the same value which you passed to authorisation URL.
            clientSecret: clientSecret
        };

        try {
            const tokenResponse = await appleSignin.getAuthorizationToken(data.code, options);

            const user = await appleSignin.verifyIdToken(tokenResponse.id_token, {
                audience: config.APPLE_CLIENT_ID, // client id - can also be an array
                ignoreExpiration: false, // default is false
            });

            let name, email

            if(data.user) {
                const details = JSON.parse(data.user)
                name = `${details.name.firstName} ${details.name.lastName}`
                email = details.email
            }

            const user_instance = await get_user_from_login(user.sub, "apple", config, name, undefined, email)

            if (!user_instance) {
                return {
                    statusCode: 301,
                    headers: {
                        Location: `/login`,
                    },
                    body: ''
                }
            }

            const jwt_token = jwt.sign({ remoteId: user_instance.remoteId }, config.JWT_SECRET, { expiresIn: 60 * 60 * config.COOKIE_EXPIRY })
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
