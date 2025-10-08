import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { ApplicationType, EventType, OnetableEventType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanCreateRole, CanManageApplications, CanWriteMoney } from '../../../shared/permissions.js';
import { admin, auth } from '@googleapis/admin';
import { ApplicationOperationType, BookingOperationType } from '../../../shared/computedDataTypes.js';
import { Jsonify } from 'type-fest'
import { queueEmail } from '../../../lambda-common/email.js';
import { postToDiscord } from '../../../lambda-common/discord.js';

const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const RoleModel: Model<RoleType> = table.getModel<RoleType>('Role')
const ApplicationModel: Model<ApplicationType> = table.getModel<ApplicationType>('Application')
const UserModel: Model<UserType> = table.getModel<UserType>('User')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event && current_user) {
            const operation: ApplicationOperationType = lambda_event.body.operation
            const appliction = await ApplicationModel.get({ eventId: event.id, userId: operation.userId })
            if (!appliction) throw new Error("Can't find application")
            CanManageApplications.throw({ user: current_user, event: event })
            console.log("Operation", JSON.stringify(operation))
            switch (operation.type) {
                case "approveApplication":
                    const maybeRole = await RoleModel.find({ userId: operation.userId, eventId: event.id, role: "Book" })
                    if (maybeRole.length > 0) return { message: "Application Already Approved" }
                    const role = await RoleModel.create({ userId: operation.userId, eventId: event.id, role: "Book" })
                    const users = await UserModel.scan()
                    const user = users.find(u => u.id === operation.userId)

                    await queueEmail({
                        template: "applicationApproved",
                        recipient: user!,
                        event: event as EventType,
                    }, config)

                    await postToDiscord(config, `${current_user.userName} approved application from ${appliction.name} (${appliction.district || "Individual"})`)

                    return { message: "Application Approved" }
                case "declineApplication":
                    await ApplicationModel.remove({ eventId: event.id, userId: operation.userId })

                    await postToDiscord(config, `${current_user.userName} declined application from ${appliction.name} (${appliction.district || "Individual"})`)

                    return { message: "Application Declined" }

                case "assignVillageToApplication":
                    await ApplicationModel.update({ eventId: event.id, userId: operation.userId, village: operation.village })
                    return { message: "Village Assigned" }
                default:
                    throw new Error("Invalid operation")
            }
        } else {
            throw new Error("Can't find event")
        }
    })