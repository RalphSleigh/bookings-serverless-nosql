import { lambda_wrapper_json } from "../../lambda-common/lambda_wrappers.js"
import { log } from "../../lambda-common/logging.js"

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        log(`CLIENT ERROR from ${current_user?.userName}: ${JSON.stringify(lambda_event.body)}`)
        return {}
    })