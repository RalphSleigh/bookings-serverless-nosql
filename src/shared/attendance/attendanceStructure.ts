import React from "react"

export abstract class AttendanceStructure {
    public abstract readonly attendanceName: string
    public abstract ConfigurationElement: React.FC<{data, update}>
}
