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

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {//@ts-ignore
    return lambda_wrapper_raw(event, async (config) => {

        console.log(event)

        const params = new URLSearchParams();
        params.append('client_id', config.MICROSOFT_CLIENT_ID);
        params.append('client_secret', config.MICROSOFT_CLIENT_SECRET);
        params.append('scope', 'openid profile');
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', `${config.BASE_URL}api/auth/microsoft/callback`);
        params.append('code', event.queryStringParameters?.code!);

        const token_response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {method: 'POST', body: params});
        const token = await token_response.json() as any
        
        console.log(token_response)
        console.log(token)

        const profile_headers = new Headers()
        profile_headers.set('Authorization', `Bearer ${token.access_token}`)

        const profile_response = await fetch(`https://graph.microsoft.com/oidc/userinfo`, { headers: profile_headers})
        const profile = await profile_response.json() as any


        console.log(profile_response)
        console.log(profile)

        try {
            const name = (profile => {
                if(profile.name) return profile.name
                if(profile.givenname && profile.familyname) return `${profile.givenname} ${profile.familyname}`
                if(profile.given_name && profile.family_name) return `${profile.given_name} ${profile.family_name}`
                if(profile.givenname) return `${profile.givenname}`
                if(profile.given_name) return `${profile.given_name}`
                return undefined
            })(profile)

            const user_instance = await get_user_from_login(profile.sub, "microsoft", config, name, undefined, profile.email)

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