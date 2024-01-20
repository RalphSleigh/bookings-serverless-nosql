import { DeleteMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { SQSEvent } from "aws-lambda";
import { get_config } from "../../lambda-common/config.js";
import { sendEmail } from "../../lambda-common/email.js";
import { flush_logs, log } from "../../lambda-common/logging.js"

export const lambdaHandler = async (event: SQSEvent): Promise<any> => {
    const config = await get_config()
    const client = new SQSClient({});
    // Delete the event from SQS

    for (const record of event.Records) {
        const data = JSON.parse(record.body)
        try {
            await sendEmail(data, config)
        } catch (error) {
            log("Error sending email:")
            log(error)
        }
        await client.send(
            new DeleteMessageCommand({
                QueueUrl: process.env.EMAIL_QUEUE_URL,
                ReceiptHandle: record.receiptHandle,
            }))
    }
    await flush_logs()
    return true;
}