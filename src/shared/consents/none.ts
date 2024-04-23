import React from "react";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { ConsentStructure, ConsentValidationResults } from "./consents_class.js";
import { PartialDeep } from "type-fest";

export class None implements ConsentStructure {
    consentName = "None"
    ParticipantFormElement({ data = {}, update }: { data: PartialDeep<Required<JsonParticipantType>["consent"]>, update: any }) {

        return null
    }

    public validate(participant: Partial<JsonParticipantType>): ConsentValidationResults {
        return []
    }
}