import { InputAdornment, TextField, Typography } from "@mui/material";
import { FeeStructure } from "./feeStructure.js";
import React from "react";

export class Free implements FeeStructure {
    public static feeName = "Free"

    public static ConfigurationElement({}) {
        return <>
            <Typography sx={{ mt: 2 }} variant="h5">No Options</Typography>
        </>
    }
}