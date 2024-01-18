import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ConfigType, get_config } from './config.js';
import { flush_logs, log } from './logging.js';
import { serializeError } from 'serialize-error';
import { get_user_from_event } from './user.js';
import { UserResponseType} from './onetable.js';
import { PermissionError } from '../shared/permissions.js';

export type LambdaJSONHandlerEvent = Pick<APIGatewayProxyEvent, Exclude<keyof APIGatewayProxyEvent, 'body'>> & { 
    body: any
}

export type LambdaJSONHandlerFunction = (lambda_event: LambdaJSONHandlerEvent, config: ConfigType, user: UserResponseType) => Promise<any>

export function lambda_wrapper_json(
    handler: LambdaJSONHandlerFunction):
    (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult> {
    return async (lambda_event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
        try {
            const config = await get_config()
            const user = await get_user_from_event(lambda_event, config)

            //log(`User ${user.userName} calling ${lambda_event.httpMethod} ${lambda_event.path}`)
            
            if (lambda_event.body) lambda_event.body = JSON.parse(lambda_event.body)
            /*
            try {
                for (const p of permissions) await p(lambda_event, user, db)
            } catch (e) {
                console.log("Permission failure:")
                console.log(e)
                return {
                    statusCode: 401,
                    body: JSON.stringify({
                        message: e instanceof Error ? e.message : 'Permission error',
                    }),
                };
            }
            since("done permissions") 
            */   
            const response = await handler(lambda_event, config, user)
            return {
                statusCode: 200,
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(response),
            }
        }
        catch (e: any) {
            if(e instanceof PermissionError) {
                console.log("Permissions Error:")
                console.log(e.stack)
                console.log(serializeError(e))
                log(`Permissions Error in ${context.functionName }`)
                log(e)
                return {
                    statusCode: 401,
                    body: JSON.stringify({
                        message: e instanceof Error ? e.message : 'Permission Erro',
                    }),
                };
            }

            console.log("General failure:")
            console.log(e.stack)
            console.log(serializeError(e))
            log(`General failure in ${context.functionName }`)
            log(e)
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: e instanceof Error ? e.message : 'Something else',
                }),
            };
        }
        finally {
            await flush_logs()
        }
    }
}

export async function lambda_wrapper_raw(handler: (config: ConfigType) => Promise<APIGatewayProxyResult>): Promise<APIGatewayProxyResult> {
    try {
        const config = await get_config()
        return await handler(config)
    }
    catch (e) {
        console.log(e)
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: e instanceof Error ? e.message : 'Something else',
            }),
        };
    }
    finally {
        await flush_logs()
    }
}