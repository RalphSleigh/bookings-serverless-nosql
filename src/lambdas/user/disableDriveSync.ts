import { UserType, table } from '../../lambda-common/onetable.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';

const UserModel = table.getModel<UserType>('User')


export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        if(current_user) {
            await UserModel.update({ remoteId: current_user.remoteId }, { remove: ['tokens'] })
            return {}
        } else {
            throw new Error("Can't Remove Drive Tokens")
        }
    }
)
