import { lambda_wrapper_json } from "../../lambda-common/lambda_wrappers.js"
import { EventBookingTimelineType, EventType, JsonEventType, table } from "../../lambda-common/onetable.js"
import { IsGlobalAdmin } from "../../shared/permissions.js"
import { OnetableEventType } from "../../lambda-common/onetable.js";

const EventModel = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        IsGlobalAdmin.throw({user: current_user!})

        const event = lambda_event.body.event as JsonEventType
        if(event.feeStructure == "large") {
            event.feeData.largeCampBands = event.feeData.largeCampBands.filter(b => {
                for(const fee of b.fees) {
                    if(fee == 0) return false
                }
                return true
            }).sort((a, b) => a.before.localeCompare(b.before))
        }

        const newEvent = await EventModel.create({...event})
        const newEventBookingTimeline = await EventBookingTimelineModel.create({eventId: newEvent.id, events: []})

        return {}
    })
