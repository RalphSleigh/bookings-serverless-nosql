import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import React, { useContext, useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonBookingType, JsonEventType, UserType } from "../../../lambda-common/onetable.js";
import { ParticipantsForm } from "./participants.js";
import { kp } from "../../../shared/kp/kp.js"

export function BookingForm({ data, event, user, update, submit, mode}: {data: Partial<JsonBookingType>, event: JsonEventType, user: UserType, update: React.Dispatch<React.SetStateAction<Partial<JsonBookingType>>>,  submit: () => void, mode: "create" | "edit"}) {

    const updateField = field => e => {
        update({ ...data, [field]: e.target.value })
        e.preventDefault()
    }

    const updateNested = field => d => {
        update({ ...data, [field]: d })
    }

    //const updateDate = field => (d, c) => {
    //    setupdateata({ ...data, [field]: d })
    //}

    const updateSwitch = field => e => {
        console.log(data)
        update({ ...data, [field]: e.target.checked })
    }

    const create = e => {
        submit()
        e.preventDefault()
    }

    const kpConfig = kp[event.kpMode] || kp.basic

    return <Grid container spacing={0}>
        <Grid xs={12} p={2} item>
                <Paper elevation={6}>
                    <Box p={2}>
                        <Typography variant="h4">{mode == "create" ? "New Booking" : `Editing - ${data.contactName}`}</Typography>
                        <form>
                            <FormGroup>
                                <TextField sx={{ mt: 2 }} required id="outlined-required" label="Booking Contact Name" value={data.contactName || ''} onChange={updateField('contactName')} />
                                {/*
                                <TextField sx={{ mt: 2 }} multiline minRows={3} id="outlined-required" label="Description" value={data.description || ''} onChange={update('description')} />
                                <UtcDatePicker sx={{ mt: 2 }} label="Start Date" value={data.startDate} onChange={updateDate('startDate')} />
                                <UtcDatePicker sx={{ mt: 2 }} label="End Date" value={data.endDate} onChange={updateDate('endDate')} />
                                <DateTimePicker sx={{ mt: 2 }} label="Booking Deadline" value={parseDate(data.bookingDeadline)} onChange={updateDate('bookingDeadline')} />
                                <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={data.bigCampMode || false} onChange={updateSwitch('bigCampMode')}/>} label="Big Camp Mode" />
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="fee-select-label">Fee Structure</InputLabel>
                                    <Select value={data.feeStructure || "default"} label="Fee Structure" onChange={update("feeStructure")} labelId="fee-select-label">
                                    {data.feeStructure ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                    {feeOptions}
                                </Select>
                                </FormControl>
                                <feeConfig.ConfigurationElement data={data.feeConfig} update={updateNested("feeConfig")}/>
                                */}
                                </FormGroup>

                            <ParticipantsForm participants={data.participants || [{}] } update={updateNested('participants')} kp={kpConfig}/>    
                            <Button sx={{ mt: 2 }} variant="contained" onClick={create}>{mode == "create" ? "Submit" : "Submit" }</Button>
                        </form>
                    </Box>
                </Paper >
        </Grid>
    </Grid>

}