import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, table } from '../../../lambda-common/onetable.js';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const BookingModel = table.getModel<BookingType>('Booking')
        const bookings = await BookingModel.find({sk: {begins: `event:${lambda_event.pathParameters?.id}:version:latest`}})
        return { bookings };
    }
)
