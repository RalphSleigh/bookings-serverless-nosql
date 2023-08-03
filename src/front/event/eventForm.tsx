import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import React, { useContext, useState } from "react";
import { UserContext } from "../user/userContext.js";
import { validate } from "./validate.js";
import { UtcDatePicker, parseDate } from "../util.js";
import { DateTimePicker } from "@mui/x-date-pickers";
import { FeeStructure } from "../../shared/fee/feeStructure.js";
import { fees } from "../../shared/fee/fee.js";
import { kp } from "../../shared/kp/kp.js"

export function EventForm({ data: inputData, submit, mode}: {data: any, submit: (data) => void, mode: "create" | "edit"}) {
    const user = useContext(UserContext)
    const [data, setData] = useState(inputData)

    const update = field => e => {
        setData({ ...data, [field]: e.target.value })
        e.preventDefault()
    }

    const updateNested = field => d => {
        setData({ ...data, [field]: d })
    }

    const updateDate = field => (d, c) => {
        setData({ ...data, [field]: d })
    }

    const updateSwitch = field => e => {
        console.log(data)
        setData({ ...data, [field]: e.target.checked })
    }

    const create = e => {
        submit(data)
        e.preventDefault()
    }

    const kpOptions = Object.entries(kp).map(([key, value]) => <MenuItem key={key} value={key}>
    {value.kpName}
    </MenuItem>)

    const feeOptions = Object.entries(fees).map(([key, value]) => <MenuItem key={key} value={key}>
        {value.feeName}
    </MenuItem>)

    const feeConfig = fees[data.feeStructure || "free"]

    return <Grid container spacing={0}>
        <Grid xs={12} p={2} item>
                <Paper elevation={6}>
                    <Box p={2}>
                        <Typography variant="h4">{mode == "create" ? "New Event" : `Editing - ${data.name}`}</Typography>
                        <form>
                            <FormGroup>
                                <TextField sx={{ mt: 2 }} required id="outlined-required" label="Name" value={data.name || ''} onChange={update('name')} />
                                <TextField sx={{ mt: 2 }} multiline minRows={3} id="outlined-required" label="Description" value={data.description || ''} onChange={update('description')} />
                                <UtcDatePicker sx={{ mt: 2 }} label="Start Date" value={data.startDate} onChange={updateDate('startDate')} />
                                <UtcDatePicker sx={{ mt: 2 }} label="End Date" value={data.endDate} onChange={updateDate('endDate')} />
                                <DateTimePicker sx={{ mt: 2 }} label="Booking Deadline" value={parseDate(data.bookingDeadline)} onChange={updateDate('bookingDeadline')} />
                                <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={data.bigCampMode || false} onChange={updateSwitch('bigCampMode')}/>} label="Big Camp Mode" />
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="fee-select-label">KP Structure</InputLabel>
                                    <Select value={data.kpMode || "default"} label="KP  Structure" onChange={update("kpMode")} labelId="kp-select-label">
                                    {data.kpMode ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                    {kpOptions}
                                </Select>
                                </FormControl>
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="fee-select-label">Fee Structure</InputLabel>
                                    <Select value={data.feeStructure || "default"} label="Fee Structure" onChange={update("feeStructure")} labelId="fee-select-label">
                                    {data.feeStructure ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                    {feeOptions}
                                </Select>
                                </FormControl>
                                <feeConfig.ConfigurationElement data={data.feeConfig} update={updateNested("feeConfig")}/>
                            </FormGroup>
                            <Button disabled={!validate(data)} sx={{ mt: 2 }} variant="contained" onClick={create}>{mode == "create" ? "Create" : "Edit" }</Button>
                        </form>
                    </Box>
                </Paper >
        </Grid>
    </Grid>

}