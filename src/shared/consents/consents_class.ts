import { PartialDeep } from "type-fest"
import { JsonParticipantType } from "../../lambda-common/onetable.js"

export type ConsentValidationResults = string[]

export abstract class ConsentStructure {
    abstract consentName: String
    abstract ParticipantFormElement: React.FunctionComponent<{ data: PartialDeep<Required<JsonParticipantType>["consent"]>, update: any }>

    public abstract validate(data: Partial<JsonParticipantType>): ConsentValidationResults
}