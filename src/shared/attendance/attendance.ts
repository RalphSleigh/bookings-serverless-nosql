import { WholeAttendance } from "./whole.js";
import { JsonEventType } from "../../lambda-common/onetable.js";
import { AttendanceStructure } from "./attendanceStructure.js";
import { OptionsAttendance } from "./options.js";

export const attendances = {
    whole: new WholeAttendance(),
    options: new OptionsAttendance()
}

export type AttendanceTypes = (typeof WholeAttendance | typeof OptionsAttendance)

type WholeInstance = InstanceType<typeof WholeAttendance>;
type OptionsAttendanceInstance = InstanceType<typeof OptionsAttendance>
type AttendanceInstance = WholeInstance | OptionsAttendanceInstance;

export const maybeGetAttendance = (event: Partial<JsonEventType>): AttendanceInstance | null => {
    if (event.attendanceStructure && attendances[event.attendanceStructure]) return attendances[event.attendanceStructure]
    else return null
}

export const getAttendance = (event: JsonEventType): AttendanceInstance => {
    return attendances[event.attendanceStructure]
}
