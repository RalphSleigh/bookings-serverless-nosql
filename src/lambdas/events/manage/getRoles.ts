import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventBookingTimelineType, EventType, RoleType, table } from '../../../lambda-common/onetable.js';
import { CanEditEvent, CanManageEvent } from '../../../shared/permissions.js';
import { getDate } from 'date-fns';

const EventModel = table.getModel<EventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({id: lambda_event.pathParameters?.id})
        if(event) {
            CanManageEvent.throw({user: current_user, event: event})
            const roles = RoleModel.find({ sk: { begins: event.id }})
            return { roles }
        } else {
            throw new Error("Can't find event")
        }
    })
