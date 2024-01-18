import { JsonBookingType, JsonParticipantType } from "../lambda-common/onetable.js";
import { AgeGroup } from "./woodcraft.js";


export type JsonParticipantWithExtraType = JsonParticipantType & {
    age: number;
    ageGroup: AgeGroup;
    booking: JsonBookingWithExtraType
};

export type JsonBookingWithExtraType = Omit<JsonBookingType, "participants"> & {
    participants: JsonParticipantWithExtraType[];
};
