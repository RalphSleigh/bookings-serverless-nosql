import { ApplicationType, BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, UserType, table } from '../../lambda-common/onetable.js';
import { CanApplyToEvent, CanBookIntoEvent } from '../../shared/permissions.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { Model } from 'dynamodb-onetable';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { queueDriveSync } from '../../lambda-common/drive_sync.js';
import { queueEmail, queueManagerEmails } from '../../lambda-common/email.js';
import { application } from 'express';
import { postToDiscord } from '../../lambda-common/discord.js';

const BookingModel: Model<OnetableBookingType> = table.getModel('Booking')
const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')
const UserModel: Model<UserType> = table.getModel<UserType>('User')
const ApplicationModel: Model<ApplicationType> = table.getModel<ApplicationType>('Application')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const applicationData = lambda_event.body.application as ApplicationType
        const event = await EventModel.get({id: applicationData.eventId})
        
        if(event && current_user) {
            CanApplyToEvent.throw({user: current_user, event:event})

            applicationData.userId = current_user.id
            const application = await ApplicationModel.create(applicationData)

            if(!current_user.userName && !current_user.email) {
                await UserModel.update({remoteId: current_user.remoteId, userName: application.name, email: application.email})
            } else if(!current_user.userName) {
                await UserModel.update({remoteId: current_user.remoteId, userName: application.name})
            } else if(!current_user.email) {
                await UserModel.update({remoteId: current_user.remoteId, email: application.email})
            }
            
            await queueEmail({
                template: "applicationReceived",
                recipient: current_user,
                event: event as EventType,
            }, config)

            await queueManagerEmails({
                template: "managerApplicationReceived",
                recipient: current_user,
                event: event as EventType,
                bookingOwner: current_user,
            }, config)

            await postToDiscord(config, `Application recieved from ${application.name} (${application.email}) - ${application.bookingType === "group" ? application.district : application.district ? `Individual - ${application.district}` : "Individual"}`)

            return {}
        } else {
            throw new Error("Can't find event")
        }    
    })