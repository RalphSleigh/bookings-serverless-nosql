import { JsonEventType } from "../../lambda-common/onetable.js";
import { Basic } from "./basic.js";
import { KpStructure } from "./kp_class.js";

export const kp: Record<string, KpStructure> = {
    basic: new Basic()
}

export const getKP = (event: JsonEventType): KpStructure => {
    return kp[event.kpMode]
}