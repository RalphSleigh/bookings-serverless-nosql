import { JsonBookingType, JsonParticipantType } from "../lambda-common/onetable.js";
import { AgeGroup } from "./woodcraft.js";


export type JsonParticipantWithExtraType = JsonParticipantType & {
    dob: Date,
    age: number;
    ageGroup: AgeGroup;
    booking: JsonBookingWithExtraType
};

export type JsonBookingWithExtraType = Omit<JsonBookingType, "participants"> & {
    participants: JsonParticipantWithExtraType[];
};

type AddPaymentType = {
    value: number,
    description: string,
    type: "addPayment"
}

type AddAdjustmentType = {
    value: number,
    description: string,
    type: "addAdjustment"
}

type RemoveFeeItemType = {
    date: string,
    type: "removeFeeItem"
}

export type BookingOperationType = AddPaymentType | AddAdjustmentType | RemoveFeeItemType

type ApproveApplicationType = {
    type: "approveApplication"
    userId: string
}

type DeclineApplicationType = {
    type: "declineApplication"
    userId: string
}

export type ApplicationOperationType = ApproveApplicationType | DeclineApplicationType