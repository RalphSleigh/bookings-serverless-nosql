import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw  } from '../../../lambda-common/lambda_wrappers.js'
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

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return lambda_wrapper_raw(event, async (config) => {

        console.log(event)

        const redirect_url = `${config.BASE_URL}api/auth/facebook/callback`

        const token_url = `https://graph.facebook.com/v15.0/oauth/access_token?client_id=${config.FACEBOOK_CLIENT_ID}&redirect_uri=${redirect_url}&client_secret=${config.FACEBOOK_CLIENT_SECRET}&code=${event.queryStringParameters?.code}`

        const token_response = await fetch(token_url)
        const token = await token_response.json() as any

        console.log(token)

        const profile_url = `https://graph.facebook.com/v15.0/me?fields=id,name,picture&access_token=${token.access_token}`
        const profile_response = await fetch(profile_url)
        const profile = await profile_response.json()

        console.log(profile)
        try {//@ts-ignore
            const user_instance = await get_user_from_login(profile.id, "facebook", config, profile.name)

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
