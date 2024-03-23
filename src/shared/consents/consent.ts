import { JsonEventType } from "../../lambda-common/onetable.js";
import { Camp100 } from "./camp100.js";
import { ConsentStructure } from "./consents_class.js";
import { None } from "./none.js";

export const consent: Record<string, ConsentStructure> = {
    none: new None(),
    camp100: new Camp100()
}

export const getConsent = (event: JsonEventType): ConsentStructure => {
    return consent[event.kpMode]
}