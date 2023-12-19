import React from "react";
import { AttendanceTypes } from "../attendance/attendance.js";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { JsonEventType } from "../../lambda-common/onetable.js";

export abstract class FeeStructure {
    public abstract readonly feeName: string
    public abstract ConfigurationElement: React.FC<{data: Partial<JsonEventType["feeData"]>, update: (data) => void}>
    public abstract supportedAttendanceStructures: AttendanceTypes[]
    public enabledForAttendance = (attendance:AttendanceStructure | null): boolean => {
        return !!attendance && !!this.supportedAttendanceStructures.find(c => attendance instanceof c)
    }
}