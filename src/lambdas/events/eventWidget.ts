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
        height: 20px;
        background-color: rgb(238, 238, 238);
        border-bottom-color: rgb(238, 238, 238);
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        border-left-color: rgb(238, 238, 238);
        border-right-color: rgb(238, 238, 238);
        order-top-color: rgb(238, 238, 238);
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        box-shadow: rgb(192, 191, 188) 0px -1px 1px 0px inset;
        box-sizing: border-box;
        color: rgb(238, 238, 238)
    }
    .filled {
        height:100%;
        background-color: #000000;
        text-align: center;
        line-height: 30px;
        color: white;
        border-radius: 10px;
        box-shadow: rgb(51, 51, 51) 0px 2px 2px 0px;
        animation: progressBar 3s ease-in-out;
        animation-fill-mode:both; 
    }

    @keyframes progressBar {
    0% { width: 0; }
    100% { width: ${percent}%; }
}
</style>
</head>
<body>
<div class="progress">
<div class="filled">
</div>
</div>
<p>${percent.toFixed(0)}%</p>
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
