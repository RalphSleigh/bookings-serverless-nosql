import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ConfigType, get_config } from './config.js';
import { flush_logs, log } from './logging.js';
import { serializeError } from 'serialize-error';
import { get_user_from_event } from './user.js';
import { UserResponseType } from './onetable.js';
import { PermissionError } from '../shared/permissions.js';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { is_warmer_event } from './warmer.js';
import am_in_lambda from './am_in_lambda.js';

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

            if (is_warmer_event(lambda_event)) {
                console.log("Evocation was a warmer event")
                //@ts-ignore
                return {}
            }


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

            log(`${user?.userName} (${user?.id} ${lambda_event.headers?.['X-Forwarded-For']}) called ${lambda_event.httpMethod} ${lambda_event.path}`)

            const response = await handler(lambda_event, config, user)

            if (response && response.statusCode) return response //we want a raw response

            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
            }
        }
        catch (e: any) {
            if (e instanceof PermissionError) {
                console.log("Permissions Error:")
                console.log(e.stack)
                console.log(serializeError(e))
                log(`Permissions Error in ${context.functionName}`)
                log(e)
                return {
                    statusCode: 401,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: e instanceof Error ? e.message : 'Permission Error',
                    }),
                };
            }

            console.log("General failure:")
            console.log(e.stack)
            console.log(serializeError(e))
            log(`General failure in ${context.functionName}`)
            log(e)

            if (am_in_lambda()) {
                const client = new SNSClient({});
                const input = { // PublishInput
                    TopicArn: process.env.SNS_QUEUE_ARN,
                    Message: JSON.stringify(e), // required  
                }
                const command = new PublishCommand(input);
                const response = await client.send(command);
            }

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

export async function lambda_wrapper_raw(lambda_event, handler: (config: ConfigType) => Promise<APIGatewayProxyResult>): Promise<APIGatewayProxyResult> {
    try {
        const config = await get_config()
        if (is_warmer_event(lambda_event)) {
            console.log("Evocation was a warmer event")
            //@ts-ignore
            return {}
        }

        log(`${lambda_event.headers?.['X-Forwarded-For']} called ${lambda_event.httpMethod} ${lambda_event.path}`)

        return await handler(config)
    }
    catch (e) {
        console.log("General failure:")
        console.log(serializeError(e))

        if (am_in_lambda()) {
            const client = new SNSClient({});
            const input = { // PublishInput
                TopicArn: process.env.SNS_QUEUE_ARN,
                Message: JSON.stringify(serializeError(e)), // required  
            }
            const command = new PublishCommand(input);
            const response = await client.send(command);
        }

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