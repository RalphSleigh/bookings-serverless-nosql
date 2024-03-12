import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { serializeError } from 'serialize-error'

export async function postToDiscord(config, message) {
    try {
        if(!config.DISCORD_ENABLED) return
        console.log("putting message in queue - discord")
        const sqsClient = new SQSClient({});
        const command = new SendMessageCommand({
            QueueUrl: process.env.DISCORD_QUEUE_URL,
            MessageBody: JSON.stringify({ message: message })
        });

        await sqsClient.send(command);
    }
    catch (e) {
        console.log("Error posting to discord")
        console.log(serializeError(e))
    }
}
