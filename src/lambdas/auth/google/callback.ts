import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import { log } from '../../../lambda-common/logging.js'
import { get_user_from_login } from '../../../lambda-common/user.js'
import { auth, plus } from '@googleapis/plus'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import fetch, { Headers } from 'node-fetch'
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import am_in_lambda from '../../../lambda-common/am_in_lambda.js';

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
    return lambda_wrapper_raw(event, async (config) => {
        try {
            const oauth2Client = new auth.OAuth2(
                config.GOOGLE_CLIENT_ID,
                config.GOOGLE_CLIENT_SECRET,
                `${config.BASE_URL}api/auth/google/callback`
            );

            console.log(JSON.stringify(event))

            if (!event.queryStringParameters?.code) throw new Error("well crap")

            // Save these somewhere safe so they can be used at a later time.
            const { tokens } = await oauth2Client.getToken(event.queryStringParameters.code)
            /* oauth2Client.setCredentials(tokens);
    
            const plus_instance = plus({ version: 'v1', auth: oauth2Client }); */

            const id_token = jwt.decode(tokens.id_token!) as jwt.JwtPayload

            /*  const profile_headers = new Headers()
             profile_headers.set('Authorization', `Bearer ${tokens.access_token}`)
     
             const profile_response = await fetch("https://openidconnect.googleapis.com/v1/userinfo?scope=openid profile",{headers: profile_headers})
             const profile = await profile_response.json() */
            /* const res = await plus_instance.people.get({
                // The ID of the person to get the profile for. The special value "me" can be used to indicate the authenticated user.
                userId: 'me'}); */

            const user_instance = await get_user_from_login(id_token.sub!, "google", config, id_token.name, id_token.picture)

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
            if (am_in_lambda()) {
                const client = new SNSClient({})
                const input = { // PublishInput
                    TopicArn: process.env.SNS_QUEUE_ARN,
                    Message: JSON.stringify(e), // required  
                }
                const command = new PublishCommand(input)
                const response = await client.send(command)
            }
            return {
                statusCode: 301,
                headers: {
                    Location: "/login?error=true",
                },
                body: ''
            } as APIGatewayProxyResult
        }
    })

}
