import { JsonEventType } from "../../lambda-common/onetable.js";
import { Basic } from "./basic.js";
import { KpStructure } from "./kp_class.js";
import { Large } from "./large.js";

export const kp: Record<string, KpStructure> = {
    basic: new Basic(),
    large: new Large()
}

export const getKP = (event: JsonEventType): KpStructure => {
    return kp[event.kpMode]
}