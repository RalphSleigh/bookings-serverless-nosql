import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventBookingTimelineType, EventType, RoleType, table } from '../../../lambda-common/onetable.js';
import { CanCreateRole, CanDeleteRole, CanEditEvent, CanManageEvent } from '../../../shared/permissions.js';
import { getDate } from 'date-fns';

const EventModel = table.getModel<EventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({id: lambda_event.pathParameters?.id})
        if(event) {
            CanDeleteRole.throw({user: current_user, event: event})
            const role = await RoleModel.remove({eventId: event.id, id: lambda_event.body.role})
            return {}
        } else {
            throw new Error("Can't find event")
        }
    })