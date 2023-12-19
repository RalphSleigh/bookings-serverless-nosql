import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import React, { useCallback, useContext, useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonBookingType, JsonEventType, UserType } from "../../../lambda-common/onetable.js";
import { ParticipantsForm } from "./participants.js";
import { kp } from "../../../shared/kp/kp.js"
import { up } from "../../../lambda-common/migrations/01-users.js";
import { getMemoUpdateFunctions } from "../../util.js";

const MemoParticipantsForm = React.memo(ParticipantsForm)

export function BookingForm({ data, event, user, update, submit, mode }: { data: Partial<JsonBookingType>, event: JsonEventType, user: UserType, update: React.Dispatch<React.SetStateAction<Partial<JsonBookingType>>>, submit: () => void, mode: "create" | "edit" }) {

    const { updateField, updateSwitch, updateSubField } = getMemoUpdateFunctions(update)

    const create = useCallback(e => {
        submit()
        e.preventDefault()
    }, [submit])

    const BasicFields = event.bigCampMode ? bookingGroupContactFields : bookingIndvidualContactFields
    const kpConfig = React.useMemo(() => kp[event.kpMode] || kp.basic, [event]);

    return <Grid container spacing={0}>
        <Grid xs={12} p={2} item>
            <Paper elevation={1}>
                <Box p={2}>
                    <Typography variant="h4">{mode == "create" ? "New Booking" : `Editing - ${data.contactName}`}</Typography>
                    <form>
                        <FormGroup>
                            <BasicFields data={data} updateField={updateField} />
                        </FormGroup>
                        <MemoParticipantsForm participants={data.participants || [{}]} update={updateSubField('participants')} kp={kpConfig} />
                        <Button sx={{ mt: 2 }} variant="contained" onClick={create}>{mode == "create" ? "Submit" : "Submit"}</Button>
                    </form>
                </Box>
            </Paper >
        </Grid>
    </Grid>
}

function bookingIndvidualContactFields({ data, updateField }: { data: Partial<JsonBookingType>, updateField: any }) {
    return <>
        <TextField sx={{ mt: 2 }} required id="outlined-required" label="Booking Contact Name" value={data.contactName || ''} onChange={updateField('contactName')} />
        <TextField sx={{ mt: 2 }} required id="outlined-required" type="email" label="Booking Contact Email" value={data.contactEmail || ''} onChange={updateField('contactEmail')} />
        <TextField sx={{ mt: 2 }} required id="outlined-required" type="tel" label="Booking Contact Phone" value={data.contactPhone || ''} onChange={updateField('contactPhone')} />
    </>
}

function bookingGroupContactFields({ data, updateField }: { data: Partial<JsonBookingType>, updateField: any }) {
    return <>
        <TextField sx={{ mt: 2 }} required id="outlined-required" label="Booking Contact Name" value={data.contactName || ''} onChange={updateField('contactName')} />
        <TextField sx={{ mt: 2 }} required id="outlined-required" label="Booking Contact Email" value={data.contactEmail || ''} onChange={updateField('contactEmail')} />
        <TextField sx={{ mt: 2 }} required id="outlined-required" label="Booking Contact Phone" value={data.contactPhone || ''} onChange={updateField('contactPhone')} />
        <TextField sx={{ mt: 2 }} required id="outlined-required" label="District" value={data.district || ''} onChange={updateField('district')} />
    </>
}