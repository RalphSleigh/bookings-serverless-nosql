import React from 'react';
import { AttendanceStructure, attendanceValidationResults } from './attendanceStructure.js';
import { JsonParticipantType } from '../../lambda-common/onetable.js';

export class WholeAttendance extends AttendanceStructure {
    public attendanceName = "Whole"

    public ConfigurationElement = (props) => {
        return <>
            <div>meh</div>
        </>
    }

    public ParticipantElement = (props) => {
        return <></>
    }

    public validate(data: Partial<JsonParticipantType>): attendanceValidationResults {
        return []
    }
}