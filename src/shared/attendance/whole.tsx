import React from 'react';
import { AttendanceStructure } from './attendanceStructure.js';

export class Whole extends AttendanceStructure {
    public attendanceName = "Whole"

    public ConfigurationElement = (props) => {
        return <>
            <div>meh</div>
        </>
    }
}