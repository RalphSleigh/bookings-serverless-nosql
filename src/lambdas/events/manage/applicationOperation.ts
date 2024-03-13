import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { ApplicationType, EventType, OnetableBookingType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanCreateRole, CanManageApplications, CanWriteMoney } from '../../../shared/permissions.js';
import { admin, auth } from '@googleapis/admin';
import { ApplicationOperationType, BookingOperationType } from '../../../shared/computedDataTypes.js';
import { Jsonify } from 'type-fest'
import { queueEmail } from '../../../lambda-common/email.js';
import { postToDiscord } from '../../../lambda-common/discord.js';

const EventModel = table.getModel<EventType>('Event')
const RoleModel: Model<RoleType> = table.getModel<RoleType>('Role')
const ApplicationModel: Model<ApplicationType> = table.getModel<ApplicationType>('Application')
const UserModel: Model<UserType> = table.getModel<UserType>('User')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event && current_user) {
            const operation: ApplicationOperationType = lambda_event.body.operation
            switch (operation.type) {
                case "approveApplication":
                    CanManageApplications.throw({ user: current_user, event: event })
                    const appliction = await ApplicationModel.get({ eventId: event.id, userId: operation.userId })
                    if (!appliction) throw new Error("Can't find application")
                    const role = await RoleModel.create({ userId: operation.userId, eventId: event.id, role: "Book" })
                    const users = await UserModel.scan()
                    const user = users.find(u => u.id === operation.userId)

                    await queueEmail({
                        template: "applicationApproved",
                        recipient: user!,
                        event: event as EventType,
                    }, config)

                    await postToDiscord(config, `${current_user.userName} approved application from ${appliction.name} (${appliction.district})`)

                    return { message: "Application Approved" }
                case "declineApplication":
                    CanManageApplications.throw({ user: current_user, event: event })
                    await ApplicationModel.remove({ eventId: event.id, userId: operation.userId })

                    await postToDiscord(config, `${current_user.userName} declined application from ${operation.userId} (TODO: get application name and district)`)

                    return { message: "Application Declined" }
                default:
                    throw new Error("Invalid operation")
            }
        } else {
            throw new Error("Can't find event")
        }
    })