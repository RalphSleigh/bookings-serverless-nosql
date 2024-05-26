import { InputAdornment, TextField, Typography } from "@mui/material";
import { FeeStructure } from "./feeStructure.js";
import React from "react";
import { WholeAttendance } from "../attendance/whole.js";
import { JsonEventType } from "../../lambda-common/onetable.js";

export class Free extends FeeStructure {
    public feeName = "Free"
    public supportedAttendanceStructures = [WholeAttendance]

    public ConfigurationElement = (props) => {
        return <>
            <Typography sx={{ mt: 2 }} variant="h5">No Options</Typography>
        </>
    }

    public StripeElement = ({ event }: { event: JsonEventType }) => {
        return null
    }
}