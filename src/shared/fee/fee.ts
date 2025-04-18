import { EventType, JsonEventType } from "../../lambda-common/onetable.js";
import { EalingC100 } from "./ealing-c100.js";
import { Ealing } from "./ealing.js";
import { FeeStructure } from "./feeStructure.js";
import { Flat } from "./flat.js";
import { Free } from "./free.js";
import { Large } from "./large.js";

export const fees = {
    ealing: new Ealing(),
    flat: new Flat(),
    free: new Free(),
    large: new Large(),
    ealingc100: new EalingC100(), 
}

type EalingInstance = InstanceType<typeof Ealing>;
type FlatFeeInstance = InstanceType<typeof Flat>
type FreeInstance = InstanceType<typeof Free>;
type LargeInstance = InstanceType<typeof Large>; 
type EalingC100Instance = InstanceType<typeof EalingC100>; 
type FeeInstance = EalingInstance | FreeInstance | FlatFeeInstance | LargeInstance | EalingC100Instance;

export const maybeGetFee = (event: Partial<JsonEventType>): FeeInstance | null => {
    if (event.feeStructure && fees[event.feeStructure]) return fees[event.feeStructure]
    else return null
}

export const getFee = (event: JsonEventType | EventType): FeeInstance => {
    return fees[event.feeStructure]
}