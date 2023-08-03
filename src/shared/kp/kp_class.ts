import { JsonParticipantType } from "../../lambda-common/onetable.js"

export abstract class KpStructure {
    abstract kpName: String
    abstract ParticipantFormElement: React.FunctionComponent<{ data: Partial<Required<JsonParticipantType>["kp"]>, update: any }>

    public static dietOptions = ["omnivore", "pescatarian", "vegetarian", "vegan"]
}