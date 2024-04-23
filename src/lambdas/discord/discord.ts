import { DeleteMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { SQSEvent } from "aws-lambda";
import { get_config } from "../../lambda-common/config.js";
import { sendEmail } from "../../lambda-common/email.js";
import { flush_logs, log } from "../../lambda-common/logging.js"
import { Client, GatewayIntentBits } from "discord.js";


/* const discordChannel = (async () => {
    const config = await get_config()
    const client = new Client({ intents: [GatewayIntentBits.Guilds] })
    await client.login(config.DISCORD_BOT_TOKEN)
    const guild = await client.guilds.fetch(config.DISCORD_GUILD_ID)
    const channel = await guild.channels.fetch(config.DISCORD_CHANNEL_ID)
    return channel
})()
 */
export const lambdaHandler = async (event: SQSEvent): Promise<any> => {
    const config = await get_config()
    const client = new SQSClient({});

    for (const record of event.Records) {
        const data = JSON.parse(record.body)
        try {
            console.log("posting to discord")
            //const channel = await discordChannel
            //@ts-ignore
            //await channel!.send(data.message);
            await fetch(config.DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: data.message })
            })
        } catch (error) {
            log("Error sending discord message:")
            log(error)
        }
        await client.send(
            new DeleteMessageCommand({
                QueueUrl: process.env.DISCORD_QUEUE_URL,
                ReceiptHandle: record.receiptHandle,
            }))
    }
    await flush_logs()
    return true;
}

