import { CloudWatchLogsClient, PutLogEventsCommand, PutLogEventsCommandOutput } from "@aws-sdk/client-cloudwatch-logs"
import { serializeError } from 'serialize-error'
import am_in_lambda from './am_in_lambda.js'

import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";



let tasks: Promise<PutLogEventsCommandOutput>[] = []

const log_group = `bookings_system_logs_${process.env.workspace}`
const log_stream = `bookings_system_logs_${process.env.workspace}`

const client = new CloudWatchLogsClient({ region: "eu-west-2" });

export function log(message) {
    try {
        if(typeof message !== "string") message = JSON.stringify(message)
        
        if (!am_in_lambda()) {
            console.log(`Not logging to cloudwatch: ${message}`)
            return
        }
        console.log(`Logging to cloudwatch: ${message}`)
        tasks.push(client.send(new PutLogEventsCommand({
            logEvents: [{
                message: message,
                timestamp: Date.now()
            }],
            logGroupName: log_group,
            logStreamName: log_stream
        })))
    } catch (e) {
        console.log("Error logging to cloudwatch")
        console.log(serializeError(e))
    }
}

export async function flush_logs() {
    try {
        await Promise.all(tasks)
        tasks = []
    } catch (e) {
        console.log("Error flushing logs to cloudwatch")
        console.log(serializeError(e))
    }
}
