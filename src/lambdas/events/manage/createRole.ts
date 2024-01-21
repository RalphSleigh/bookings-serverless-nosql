import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventType, RoleType, table } from '../../../lambda-common/onetable.js';
import { CanCreateRole } from '../../../shared/permissions.js';

const EventModel = table.getModel<EventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({id: lambda_event.pathParameters?.id})
        if(event) {
            CanCreateRole.throw({user: current_user, event: event, role: lambda_event.body.role})
            const role = await RoleModel.create(lambda_event.body.role)
            return {}
        } else {
            throw new Error("Can't find event")
        }
    })