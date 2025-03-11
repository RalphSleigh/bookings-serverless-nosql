import React from "react";
import { AttendanceTypes } from "../attendance/attendance.js";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { BookingType, EventType, JsonBookingType, JsonEventType } from "../../lambda-common/onetable.js";
import { PartialDeep } from "type-fest";
import { JsonBookingWithExtraType } from "../computedDataTypes.js";

export interface FeeLine {
    description: string,
    tooltip?: string,
    values: number[]
}

export abstract class FeeStructure {
    public abstract readonly feeName: string
    public abstract readonly hasPaymentReference: boolean
    public abstract ConfigurationElement: React.FC<{ attendanceData: JsonEventType["attendanceData"], data: Partial<JsonEventType["feeData"]>, update: (data) => void}>
    public abstract supportedAttendanceStructures: AttendanceTypes[]
    public enabledForAttendance = (attendance:AttendanceStructure | null): boolean => {
        return !!attendance && !!this.supportedAttendanceStructures.find(c => attendance instanceof c)
    }
    public abstract getFeeLines: (event: JsonEventType, booking: PartialDeep<JsonBookingType> | BookingType | JsonBookingWithExtraType) => FeeLine[]
    public abstract DescriptionElement: React.FC<{event: JsonEventType, booking: PartialDeep<JsonBookingType>}>
    public abstract EmailElement: React.FC<{event: EventType, booking: BookingType}>
    public abstract getValueLabels: () => string[]
    public abstract getPaymentReference(booking: (PartialDeep<JsonBookingType> | BookingType) & { userId: string }): string | undefined
    public abstract StripeElement: React.FC<{event: JsonEventType, booking: JsonBookingType}>
    public processBookingUpdate(event: JsonEventType | EventType, existingBooking: BookingType | Partial<BookingType> | PartialDeep<JsonBookingType>, newBooking: BookingType | Partial<BookingType> | PartialDeep<JsonBookingType>) {}
}