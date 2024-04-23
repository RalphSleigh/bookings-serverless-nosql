import React from 'react';
import { AttendanceStructure, attendanceValidationResults } from './attendanceStructure.js';
import { getMemoUpdateFunctions } from '../util.js';
import { FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { JsonEventType, JsonParticipantType, ParticipantAttendanceType } from '../../lambda-common/onetable.js';

export class OptionsAttendance extends AttendanceStructure {
    public attendanceName = "Options"

    public ConfigurationElement: React.FC<{ data, update }> = ({ data, update }) => {

        const { updateSubField } = getMemoUpdateFunctions(update)
        const { setArrayItemFilter } = getMemoUpdateFunctions(updateSubField('options'))

        const textFields = data?.options.map((option, i) => {
            return <TextField
                key={i}
                fullWidth
                sx={{ mt: 2 }}
                id="outlined-required"
                label="Option"
                value={option}
                onChange={setArrayItemFilter(i)} />
        }) || []

        textFields.push(<TextField fullWidth key={data?.options?.length || 0} sx={{ mt: 2 }} required id="outlined-required" label="Option" value={''} onChange={setArrayItemFilter(data?.options?.length || 0)} />)

        return <Paper elevation={5} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6">Options</Typography>
            {textFields}
        </Paper>
    }

    ParticipantElementNonMemo = ({ configuration, data, update }: { configuration: JsonEventType["attendanceData"], data: ParticipantAttendanceType | undefined, update: any }) => {

        const { updateField } = getMemoUpdateFunctions(update("attendance"))

        const attendanceOptions = configuration!.options!.map((d, i) => <MenuItem key={i} value={i}>{d}
        </MenuItem>)


        return <FormControl required fullWidth>
            <InputLabel id="attendance-select-label">Attendance</InputLabel>
            <Select value={typeof data?.option == "number" ? data?.option : "default"} label="Attendance" required onChange={updateField("option")} labelId="attendance-select-label">
                {data?.option ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                {attendanceOptions}
            </Select>
        </FormControl>

    }

    public ParticipantElement = React.memo(this.ParticipantElementNonMemo)

    public validate(participant: Partial<JsonParticipantType>): attendanceValidationResults {
        const results: attendanceValidationResults = []
        if (participant.basic?.name) {
            if (typeof participant.attendance?.option !== "number") results.push(`Please select an attendance option for ${participant.basic?.name}`)
        }
        return results
    }
}