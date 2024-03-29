import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_json, user, orm } from '../../../lambda-common'
import { getEventDetails } from '../../../lambda-common/util';
import { warm_management } from '../../../lambda-common/warmer';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = lambda_wrapper_json([],
    async (lambda_event, db, config, current_user) => {

        const promises = warm_management()

        const event = await getEventDetails(db, lambda_event.pathParameters?.id!)

        await promises
        
        return { events: [event] };
    }
)
