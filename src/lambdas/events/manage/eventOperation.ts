import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, EventType, OnetableBookingType, OnetableEventType, RoleType, UserType, table } from '../../../lambda-common/onetable.js';
import { CanManageVillages } from '../../../shared/permissions.js';
import { EventOperationType } from '../../../shared/computedDataTypes.js';
import { Jsonify } from 'type-fest'
import { add } from 'date-fns';
import { addVersionToBooking } from '../../../lambda-common/util.js';

const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>("Booking");


export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        if (event && current_user) {
                const operation: EventOperationType = lambda_event.body.operation
                console.log("Operation", JSON.stringify(operation))
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
                        const villageIndex = event.villages?.findIndex(v => v.name === operation.name)
                        if (villageIndex === -1) {
                            throw new Error("Village not found")
                        }
                        const villages = event.villages?.filter(v => v.name !== operation.name)
                        await EventModel.update({ id: event.id },
                            {
                                set: { villages: villages }
                            })
                        return { message: "Village removed" }
                    case "renameVillage":
                        CanManageVillages.throw({ user: current_user, event: event })
                        const renameVillageIndex = event.villages?.findIndex(v => v.name === operation.oldName)
                        if (renameVillageIndex === -1) {
                            throw new Error("Village not found")
                        }
                        const renamedVillages = event.villages?.map(v => v.name === operation.oldName ? { ...v, name: operation.newName, town: operation.newTownName } : v)
                        await EventModel.update({ id: event.id },
                            {
                                set: { villages: renamedVillages }
                            })
                        const bookings = await BookingModel.find({ sk: { begins: `event:${event.id}` }, village: operation.oldName, version: 'latest', deleted: false }) as [OnetableBookingType]
                        for(const b of bookings) {
                            await addVersionToBooking(event as EventType, b as BookingType, { village: operation.newName })
                        }
                        
                        return { message: "Village renamed" }
                    default:
                        throw new Error("Invalid operation")
                }
        } else {
            throw new Error("Can't find event")
        }
    })