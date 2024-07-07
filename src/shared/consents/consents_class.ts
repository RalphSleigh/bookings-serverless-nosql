import { PartialDeep } from "type-fest"
import { JsonEventType, JsonParticipantType } from "../../lambda-common/onetable.js"
import { JsonParticipantWithExtraType } from "../computedDataTypes.js"

export type ConsentValidationResults = string[]

export abstract class ConsentStructure {
    abstract consentName: String
    abstract ParticipantFormElement: React.FunctionComponent<{ data: PartialDeep<Required<JsonParticipantType>["consent"]>, basic: PartialDeep<Required<JsonParticipantType>["basic"]>, event: JsonEventType, update: any }>
    abstract PaticipantCardElement: React.FunctionComponent<{ data: JsonParticipantWithExtraType }>

    public abstract validate(event: JsonEventType, data: PartialDeep<JsonParticipantType>): ConsentValidationResults
}