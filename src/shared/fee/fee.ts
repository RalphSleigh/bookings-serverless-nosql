import { JsonEventType } from "../../lambda-common/onetable.js";
import { Ealing } from "./ealing.js";
import { FeeStructure } from "./feeStructure.js";
import { Flat } from "./flat.js";
import { Free } from "./free.js";

export const fees = {
    ealing: new Ealing(),
    flat: new Flat(),
    free: new Free()
}

type EalingInstance = InstanceType<typeof Ealing>;
type FlatFeeInstance = InstanceType<typeof Flat>
type FreeInstance = InstanceType<typeof Free>;
type FeeInstance = EalingInstance | FreeInstance | FlatFeeInstance;

export const maybeGetFee = (event: Partial<JsonEventType>): FeeInstance | null => {
    if (event.feeStructure && fees[event.feeStructure]) return fees[event.feeStructure]
    else return null
}

export const getFee = (event: JsonEventType): FeeInstance => {
    return fees[event.feeStructure]
}