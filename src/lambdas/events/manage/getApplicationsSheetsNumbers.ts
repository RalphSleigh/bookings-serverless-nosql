import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { ApplicationType, EventBookingTimelineType, EventType, OnetableEventType, RoleType, table } from '../../../lambda-common/onetable.js';
import { CanEditEvent, CanManageApplications, CanManageEvent } from '../../../shared/permissions.js';
import { getDate } from 'date-fns';
import { getParticipantsFromSheet } from '../../../lambda-common/sheets_input.js';
import { Model } from 'dynamodb-onetable';

const EventModel = table.getModel<OnetableEventType>('Event')
const ApplicationModel: Model<ApplicationType> = table.getModel<ApplicationType>('Application')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event) {
            CanManageApplications.throw({ user: current_user, event: event })
            const applications = await ApplicationModel.find({ sk: { begins: `event:${event.id}` } })

            const participantsInSheet = {}

            const promises = applications.map(async a => {
                try {
                //@ts-expect-error
                const participants = await getParticipantsFromSheet(config, event, { id: a.userId })
                participantsInSheet[a.userId] = participants.length
                } catch (e) {
                    participantsInSheet[a.userId] = 0
                }

            })

            await Promise.all(promises)

            return participantsInSheet
        } else {
            throw new Error("Can't find event")
        }
    })
