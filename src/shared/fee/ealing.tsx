import { InputAdornment, TextField, Typography } from "@mui/material";
import { FeeStructure } from "./feeStructure.js";
import React from "react";

export class Ealing implements FeeStructure {
    public static feeName = "Ealing"

    public static ConfigurationElement({data = {}, update}: {data: any, update: (data) => void}) {

        const updateField = field => e => {
            update({ ...data, [field]: e.target.value })
            e.preventDefault()
        }

        return <>
            <Typography sx={{ mt: 2 }} variant="h5">Ealing fee options</Typography>
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
}