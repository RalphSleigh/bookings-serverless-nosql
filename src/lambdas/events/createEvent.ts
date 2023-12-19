import { lambda_wrapper_json } from "../../lambda-common/lambda_wrappers.js"
import { EventBookingTimelineType, EventType, table } from "../../lambda-common/onetable.js"
import { IsGlobalAdmin } from "../../shared/permissions.js"
import { OnetableEventType } from "../../lambda-common/onetable.js";

const EventModel = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        IsGlobalAdmin.throw({user: current_user})

        const newEvent = await EventModel.create({...lambda_event.body.event})
        const newEventBookingTimeline = await EventBookingTimelineModel.create({eventId: newEvent.id, events: []})

        return {}
    })
