import { Model } from 'dynamodb-onetable';
import { postToDiscord } from '../../../lambda-common/discord.js';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanDeleteRole } from '../../../shared/permissions.js';

const EventModel = table.getModel<EventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')
const UserModel: Model<UserType> = table.getModel<UserType>('User')


export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({id: lambda_event.pathParameters?.id})
        const role = await RoleModel.get({id: lambda_event.body.role, eventId: event.id})
        if(event && role && current_user) {
            CanDeleteRole.throw({user: current_user, event, role})
            const targetUser = (await UserModel.scan()).find(u => u.id === role.userId)
            RoleModel.remove(role)
            await postToDiscord(config, `${current_user!.userName} **revoked** ${targetUser!.userName} role ${role!.role} for ${event!.name}`)
            return {}
        } else {
            throw new Error("Can't find event")
        }
    })