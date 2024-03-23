import { PartialDeep } from "type-fest"
import { JsonEventType, JsonParticipantType } from "../../lambda-common/onetable.js"

export type ConsentValidationResults = string[]

export abstract class ConsentStructure {
    abstract consentName: String
    abstract ParticipantFormElement: React.FunctionComponent<{ data: PartialDeep<Required<JsonParticipantType>["consent"]>, basic: PartialDeep<Required<JsonParticipantType>["basic"]>, event: JsonEventType, update: any }>

    public abstract validate(event: JsonEventType, data: Partial<JsonParticipantType>): ConsentValidationResults
}