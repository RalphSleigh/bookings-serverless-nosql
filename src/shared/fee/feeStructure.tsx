import React from "react";
import { AttendanceTypes } from "../attendance/attendance.js";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { BookingType, EventType, JsonBookingType, JsonEventType } from "../../lambda-common/onetable.js";
import { PartialDeep } from "type-fest";

export interface FeeLine {
    description: string,
    values: number[]
}

export abstract class FeeStructure {
    public abstract readonly feeName: string
    public abstract ConfigurationElement: React.FC<{data: Partial<JsonEventType["feeData"]>, update: (data) => void}>
    public abstract supportedAttendanceStructures: AttendanceTypes[]
    public enabledForAttendance = (attendance:AttendanceStructure | null): boolean => {
        return !!attendance && !!this.supportedAttendanceStructures.find(c => attendance instanceof c)
    }
    public abstract getFeeLines: (event: JsonEventType, booking: PartialDeep<JsonBookingType>) => FeeLine[]
    public abstract DescriptionElement: React.FC<{event: JsonEventType, booking: PartialDeep<JsonBookingType>}>
    public abstract EmailElement: React.FC<{event: EventType, booking: BookingType}>
    public abstract getValueLabels: () => string[]
} 