import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventType, RoleType, table } from '../../../lambda-common/onetable.js';
import { CanDeleteRole } from '../../../shared/permissions.js';

const EventModel = table.getModel<EventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({id: lambda_event.pathParameters?.id})
        const role = await RoleModel.get({id: lambda_event.body.role, eventId: event.id})
        if(event) {
            CanDeleteRole.throw({user: current_user, event, role})
            RoleModel.remove(role)
            return {}
        } else {
            throw new Error("Can't find event")
        }
    })