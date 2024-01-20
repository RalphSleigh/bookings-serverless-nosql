import { DeleteMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

 const lambdaHandler = async (event: any): Promise<any> => {
    console.log(event);

    // Delete the event from SQS
    const client = new SQSClient({});
    await client.send(
        new DeleteMessageCommand({
            QueueUrl: process.env.EMAIL_QUEUE_URL,
            ReceiptHandle: event.ReceiptHandle,
        }))

    return true;
}