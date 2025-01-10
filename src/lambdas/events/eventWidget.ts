import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import { flush_logs, log } from '../../lambda-common/logging.js';
import { get_config } from '../../lambda-common/config.js';
import { get_user_from_event } from '../../lambda-common/user.js';
import { BookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { Model } from 'dynamodb-onetable';


/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const EventModel = table.getModel<OnetableEventType>('Event')
const BookingModel: Model<BookingType> = table.getModel<BookingType>('Booking')

export const lambdaHandler = async (lambdaEvent: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {

        const event = await EventModel.get({ id: lambdaEvent.pathParameters?.id })

        const bookings = await BookingModel.find({ sk: { begins: `event:${event!.id}:version:latest` } }) as BookingType[]

        const filtered = bookings.filter(b => b.deleted === false)

        const total = filtered.reduce((acc, b) => acc + b.participants.length, 0)

        const target = parseInt(lambdaEvent.queryStringParameters?.target ?? "1000")

        const percent = (total / target) * 100

        const text = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Event Widget</title>
<style>
    body {
        font-family: Arial, sans-serif;
    }
    .progress {
        width: 100%;
        background-color: #a3a3a3;
        height: 30px;
        border-radius: 5px;
    }
    .filled {
        width: ${percent}%;
        height:100%;
        background-color: #000000;
        text-align: center;
        line-height: 30px;
        color: white;
        border-radius: 5px;
    }
</style>
</head>
<body>
<div class="progress">
<div class="filled">
${total}
</div>
</div>
</body>
</html>`

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: text,
        }
    }
    catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: e instanceof Error ? e.message : 'Something else',
            }),
        };
    }
}
