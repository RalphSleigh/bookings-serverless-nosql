import React from 'react';
import { AttendanceStructure } from './attendanceStructure.js';

export class TestBigAttendance extends AttendanceStructure {
    public attendanceName = "TestBigAttendance"

    public ConfigurationElement = (props) => {
        return <>
            <div>Meh</div>
        </>
    }
}