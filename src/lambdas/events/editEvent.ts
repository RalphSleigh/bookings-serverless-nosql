import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanEditEvent } from '../../shared/permissions.js';
import { getDate } from 'date-fns';

const EventModel = table.getModel<OnetableEventType>('Event')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        console.log(`Edited event ${lambda_event.body.id}`);

        console.log(lambda_event.body.event.id)
        const event = await EventModel.get({ id: lambda_event.body.event.id })
        if (event) {
            CanEditEvent.throw({ user: current_user, event: event })

            const newEvent = lambda_event.body.event
            if (newEvent.feeStructure == "large") {
                newEvent.feeData.largeCampBands = newEvent.feeData.largeCampBands.filter(b => {
                    if (!b.fees) return false
                    for (const fee of b.fees) {
                        if (fee == 0) return false
                    }
                    return true
                }).sort((a, b) => a.before.localeCompare(b.before))
            }

            await EventModel.update(newEvent, { partial: false })
            return {};
        } else {
            throw new Error("Can't find event")
        }
    })
