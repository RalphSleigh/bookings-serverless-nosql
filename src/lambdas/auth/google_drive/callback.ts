import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_raw } from '../../../lambda-common/lambda_wrappers.js'
import { log } from '../../../lambda-common/logging.js'
import { get_user_from_event, get_user_from_login } from '../../../lambda-common/user.js'
import { auth, sheets } from '@googleapis/sheets'
import { drive } from '@googleapis/drive'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import fetch, { Headers } from 'node-fetch'
import { UserType, table } from '../../../lambda-common/onetable.js';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const UserModel = table.getModel<UserType>('User')

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {//@ts-ignore
    return lambda_wrapper_raw(event, async (config) => {
        try {
            const oauth2Client = new auth.OAuth2(
                config.GOOGLE_CLIENT_ID,
                config.GOOGLE_CLIENT_SECRET,
                `${config.BASE_URL}api/auth/google_drive/callback`
            );

            console.log(JSON.stringify(event))

            if (!event.queryStringParameters?.code) throw new Error("well crap")

            // Save these somewhere safe so they can be used at a later time.
            const { tokens } = await oauth2Client.getToken(event.queryStringParameters.code)
            const id_token = jwt.decode(tokens.id_token!) as jwt.JwtPayload

            await UserModel.update({ remoteId: `google${id_token.sub}`, tokens })


            /*  oauth2Client.setCredentials(tokens);
             /* oauth2Client.setCredentials(tokens);
     
             const plus_instance = plus({ version: 'v1', auth: oauth2Client }); 
 
             const sheets_instace = sheets({ version: 'v4', auth: oauth2Client })
             //@ts-ignore
             const drive_instance = drive({ version: 'v3', auth: oauth2Client })  
 
             const list = await drive_instance.files.list({
                 q: `mimeType='application/vnd.google-apps.spreadsheet' and name='bookings-test-sheet'`,
                 fields: 'files(id, name)'})
 
             //const sheet = sheets_instace.spreadsheets.get()
             let sheet
                 
             if(list.data.files?.length === 0) {
                 sheet = await sheets_instace.spreadsheets.create({resource: {properties:{title: 'bookings-test-sheet'}}, fields: 'spreadsheetId'})
             } */

            return {
                statusCode: 301,
                headers: {
                    Location: `/`,
                },
                body: ''
            }
        } catch (e) {
            throw e
        }
    })

}
