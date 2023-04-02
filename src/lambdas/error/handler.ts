import { lambda_wrapper_json, user } from '../../lambda-common'
import { log } from '../../lambda-common';

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
        log(`CLIENT ERROR from ${current_user.userName}: ${JSON.stringify(lambda_event.body)}`)
        return {}
    })