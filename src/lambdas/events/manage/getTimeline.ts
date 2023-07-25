import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventBookingTimelineType, EventType, table } from '../../../lambda-common/onetable.js';
import { CanEditEvent, CanManageEvent } from '../../../shared/permissions.js';
import { getDate } from 'date-fns';

const EventModel = table.getModel<EventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const event = await EventModel.get({id: lambda_event.pathParameters?.eventId})
        const timeline = await EventBookingTimelineModel.get({eventId: lambda_event.pathParameters?.eventId})
        if(event && timeline) {
            CanManageEvent.throw({user: current_user, event: event})
            return { timeline }
        } else {
            throw new Error("Can't find event")
        }
    })
