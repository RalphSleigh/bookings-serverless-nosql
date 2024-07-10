import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { EventType, OnetableBookingType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanManageVillages } from '../../../shared/permissions.js';
import { EventOperationType } from '../../../shared/computedDataTypes.js';
import { Jsonify } from 'type-fest'

const EventModel = table.getModel<EventType>('Event')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event && current_user) {
                const operation: EventOperationType = lambda_event.body.operation
                switch (operation.type) {
                    case "addVillage":
                        CanManageVillages.throw({ user: current_user, event: event })
                        const village: Required<EventType>["villages"][0][] = [{name: lambda_event.body.operation.name, town: lambda_event.body.operation.town}]
                        await EventModel.update({ id: event.id},
                            {
                                set: { villages: 'list_append(if_not_exists(villages, @{emptyList}), @{newVillage})' },
                                substitutions: { emptyList: [], newVillage: village }
                            })
                        return { message: "Village added" }
                    case "removeVillage":
                        CanManageVillages.throw({ user: current_user, event: event })
                        const villageIndex = event.villages.findIndex(v => v.name === operation.name)
                        if (villageIndex === -1) {
                            throw new Error("Village not found")
                        }
                        const villages = event.villages.filter(v => v.name !== operation.name)
                        await EventModel.update({ id: event.id },
                            {
                                set: { villages: villages }
                            })
                        return { message: "Village removed" }
                    default:
                        throw new Error("Invalid operation")
                }
        } else {
            throw new Error("Can't find event")
        }
    })