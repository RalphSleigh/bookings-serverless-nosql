import { JsonParticipantType } from "../../lambda-common/onetable.js"

export type kpValidationResults = string[]

export abstract class KpStructure {
    abstract kpName: String
    abstract ParticipantFormElement: React.FunctionComponent<{ data: Partial<Required<JsonParticipantType>["kp"]>, update: any }>

    public abstract validate(data: Partial<JsonParticipantType>): kpValidationResults

    public static dietOptions = ["omnivore", "pescatarian", "vegetarian", "vegan"]
}