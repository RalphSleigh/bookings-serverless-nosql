import { InputAdornment, TextField, Typography } from "@mui/material";
import { FeeStructure } from "./feeStructure.js";
import React from "react";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { Whole } from "../attendance/whole.js";
import { JsonBookingType, JsonEventType } from "../../lambda-common/onetable.js";

export class Flat extends FeeStructure {
    public feeName = "Flat"
    public supportedAttendanceStructures = [Whole]

    public ConfigurationElement = ({data, update}) => {

        const updateField = field => e => {
            update({ ...data, [field]: e.target.value })
            e.preventDefault()
        }

        return <>
            <Typography sx={{ mt: 2 }} variant="h5">Flat fee options</Typography>
            <TextField 
            InputProps={{startAdornment: <InputAdornment position="start">£</InputAdornment>}} 
            sx={{ mt: 2 }} 
            required 
            id="outlined-required" 
            label="Name"
            type="number"
            value={data?.fee} 
            onChange={updateField('fee')} /> 
        </>
    }

    public DescriptionElement = ({ event, booking }: { event: JsonEventType, booking: Partial<JsonBookingType> }) => {
        return (<>
            <Typography variant="body2" mt={2}>Ok</Typography>
        </>)
    }
}