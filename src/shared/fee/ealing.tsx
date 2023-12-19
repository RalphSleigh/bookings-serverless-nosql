import { Grid, InputAdornment, TextField, Typography } from "@mui/material";
import { FeeStructure } from "./feeStructure.js";
import React from "react";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { Whole } from "../attendance/whole.js";
import { JsonEventType } from "../../lambda-common/onetable.js";

export class Ealing extends FeeStructure {
    public feeName = "Ealing"
    public supportedAttendanceStructures = [Whole]

    public ConfigurationElement = ({ data, update }: { data: Partial<JsonEventType["feeData"]>, update: any }) => {

        const updatNumberField = field => e => {
            update({ ...data, [field]: parseInt(e.target.value) })
            e.preventDefault()
        }

        return <>
            <Typography sx={{ mt: 2 }} variant="h5">Ealing fee options</Typography>
            <Grid container spacing={2} p={2}>
                <Grid xs={6}>
                    <TextField
                        fullWidth 
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2 }}
                        required
                        id="outlined-required"
                        label="Unaccompanied"
                        type="number"
                        value={data.ealingUnaccompanied}
                        onChange={updatNumberField('ealingUnaccompanied')} />
                </Grid>
                <Grid xs={6}>
                    <TextField
                        fullWidth 
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2, ml: 2 }}
                        required
                        id="outlined-required"
                        label="Unaccompanied Discount"
                        type="number"
                        value={data.ealingDiscountUnaccompanied}
                        onChange={updatNumberField('ealingDiscountUnaccompanied')} />
                </Grid>
                <Grid xs={6}>
                    <TextField
                        fullWidth 
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2}}
                        required
                        id="outlined-required"
                        label="Accompanied"
                        type="number"
                        value={data.ealingAccompanied}
                        onChange={updatNumberField('ealingAccompanied')} />
                </Grid>
                <Grid xs={6}>
                    <TextField
                        fullWidth 
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2, ml: 2 }}
                        required
                        id="outlined-required"
                        label="Accompanied Discount"
                        type="number"
                        value={data.ealingDiscountAccompanied}
                        onChange={updatNumberField('ealingDiscountAccompanied')} />
                </Grid>
            </Grid>
        </>
    }
}
