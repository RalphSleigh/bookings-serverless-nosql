import { Whole } from "./whole.js";
import { JsonEventType } from "../../lambda-common/onetable.js";
import { AttendanceStructure } from "./attendanceStructure.js";
import { TestBigAttendance } from "./testBigAttendance.js";

export const attendances = {
    whole: new Whole(),
    testBigAttendance: new TestBigAttendance()
}

export type AttendanceTypes = (typeof Whole | typeof TestBigAttendance)

type WholeInstance = InstanceType<typeof Whole>;
type TestBigAttendanceInstance = InstanceType<typeof TestBigAttendance>
type AttendanceInstance = WholeInstance | TestBigAttendanceInstance;

export const maybeGetAttendance = (event: Partial<JsonEventType>): AttendanceInstance | null => {
    if (event.attendanceStructure && attendances[event.attendanceStructure]) return attendances[event.attendanceStructure]
    else return null
}

export const getAttendance = (event: JsonEventType): AttendanceInstance => {
    return attendances[event.attendanceStructure]
}
