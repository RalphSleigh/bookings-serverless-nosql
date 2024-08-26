import am_in_lambda from "../../lambda-common/am_in_lambda.js";
import { lambda_wrapper_json } from "../../lambda-common/lambda_wrappers.js"
import { log } from "../../lambda-common/logging.js"
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        log(`CLIENT ERROR from ${current_user?.userName}: ${JSON.stringify(lambda_event.body)} using ${lambda_event.headers['User-Agent']}` )

        if(!am_in_lambda()) return {}
        const client = new SNSClient({});
        const input = { // PublishInput
            TopicArn: process.env.SNS_QUEUE_ARN,
            Message: JSON.stringify({body: lambda_event.body, agent: lambda_event.headers['User-Agent']}), // required  
        }
        const command = new PublishCommand(input);
        const response = await client.send(command);
        return {}
    })