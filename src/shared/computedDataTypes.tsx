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
    town: string;
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

type AssignVillageType = {
    type: "assignVillage",
    village: string
}

type UnassignVillageType = {
    type: "unassignVillage",
    village: string
}

export type BookingOperationType = AddPaymentType | AddAdjustmentType | RemoveFeeItemType | AssignVillageType | UnassignVillageType

type ApproveApplicationType = {
    type: "approveApplication"
    userId: string
}

type DeclineApplicationType = {
    type: "declineApplication"
    userId: string
}

export type ApplicationOperationType = ApproveApplicationType | DeclineApplicationType

type AddVillageType = {
    type: "addVillage",
    name: string
    town: string
}

type RemoveVillageType = {
    type: "removeVillage",
    name: string
}

type RenameVillageType = {
    type: "renameVillage",
    oldName: string
    newName: string
    newTownName: string
}

export type EventOperationType = AddVillageType | RemoveVillageType | RenameVillageType