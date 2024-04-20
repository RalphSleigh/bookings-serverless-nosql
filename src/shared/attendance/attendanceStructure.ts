import React from "react"
import { JsonParticipantType } from "../../lambda-common/onetable.js"
import { PartialDeep } from "type-fest"

export type attendanceValidationResults = string[]

export abstract class AttendanceStructure {
    public abstract readonly attendanceName: string
    public abstract ConfigurationElement: React.FC<{data, update}>
    public abstract ParticipantElement: React.FC<{ configuration, data, update }>
    public abstract validate(data: PartialDeep<JsonParticipantType>): attendanceValidationResults
}
