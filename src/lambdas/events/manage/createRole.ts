import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanCreateRole } from '../../../shared/permissions.js';
import { admin, auth } from '@googleapis/admin';
import { queueEmail } from '../../../lambda-common/email.js';

const EventModel = table.getModel<EventType>('Event')
const RoleModel: Model<RoleType> = table.getModel<RoleType>('Role')
const UserModel: Model<UserType> = table.getModel<UserType>('User')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (current_user && event) {
            CanCreateRole.throw({ user: current_user, event: event, role: lambda_event.body.role })

            const targetUser = (await UserModel.scan()).find(u => u.id === lambda_event.body.role.userId)

            if(!targetUser) throw new Error("Can't find user")

            if (event.bigCampMode) {

                if (!targetUser) throw new Error("Can't find user")
                if (targetUser.source !== "google") throw new Error("User is not a Woodcraft GSuite account")
                const auth_client = new auth.JWT(
                    config.EMAIL_CLIENT_EMAIL,
                    '',
                    config.EMAIL_PRIVATE_KEY,
                    ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
                    config.EMAIL_FROM
                );

                const directory = admin({ version: 'directory_v1', auth: auth_client })
                let user
                try {
                    user = await directory.users.get({
                        userKey: targetUser.remoteId.replace("google","")
                    })
                } catch (e) {
                    throw new Error("User is not a Woodcraft GSuite account")
                }
                if (user.data.isEnrolledIn2Sv === false) throw new Error("User does not have 2FA enabled on account")
                
            }

            const role = await RoleModel.create(lambda_event.body.role)

            if(role.role !== "Book") {
                await queueEmail({
                    template: "managerDataAccess",
                    recipient: targetUser,
                    event: event as EventType,
                }, config)
            }

            return {}
        } else {
            throw new Error("Can't find event")
        }
    })