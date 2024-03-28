import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json, lambda_wrapper_raw } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanDeleteBooking, CanDeleteOwnBooking, CanEditBooking, CanEditEvent, PermissionError } from '../../shared/permissions.js';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { queueDriveSync } from '../../lambda-common/drive_sync.js';
import { queueManagerEmails } from '../../lambda-common/email.js';

import { verify } from "discord-verify/node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatDuration, intervalToDuration } from 'date-fns';


export const lambdaHandler = async (lambda_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => { //@ts-ignore
    return lambda_wrapper_raw(lambda_event, async (config) => {
        console.log(JSON.stringify(lambda_event))


        const signature = lambda_event.headers["x-signature-ed25519"];
        const timestamp = lambda_event.headers["x-signature-timestamp"];
        const rawBody = lambda_event.body;

        const isValid = await verify(
            rawBody,
            signature,
            timestamp,
            config.DISCORD_PUBLIC_KEY,
            globalThis.crypto.subtle
        );

        if (!isValid) {
            return { statusCode: 401, body: "Invalid request signature" };
        }

        const body = JSON.parse(rawBody!);

        if (body.type === 1) {
            return { statusCode: 200, body: JSON.stringify({ type: 1 }) };
        }

        console.log(rawBody)


        if (body.data.name === "campstarts") {

            const result = formatDuration(intervalToDuration({ start: new Date(), end: new Date(2025, 6, 27, 12, 0, 0) }), { delimiter: ', ' }).replace("minutes,", "minutes and")

            return {
                statusCode: 200, body: JSON.stringify({
                    "type": 4,
                    "data": {
                        "tts": false,
                        "content": `🌞⛺⛺⛺🌲  Camp 100 begins in ${result}!  🌲⛺⛺⛺🌞`,
                        "embeds": [],
                        "allowed_mentions": { "parse": [] }
                    }
                })
            }
        }

        if (body.data.name === "bookingsopen") {

            const result = formatDuration(intervalToDuration({ start: new Date(), end: new Date(2024, 6, 0, 0, 0, 0) }), { delimiter: ', ' }).replace("minutes,", "minutes and")

            return {
                statusCode: 200, body: JSON.stringify({
                    "type": 4,
                    "data": {
                        "tts": false,
                        "content": `📝🧑‍💻🎟️  Bookings Open in ${result}!  🎟️🧑‍💻📝`,
                        "embeds": [],
                        "allowed_mentions": { "parse": [] }
                    }
                })
            }
        }
    })
}

