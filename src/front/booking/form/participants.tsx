import { Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, IconButton, CardMedia, Divider, InputAdornment, Tooltip } from "@mui/material";
import React, { useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonBookingType, JsonEventType, JsonParticipantType, UserType } from "../../../lambda-common/onetable.js";
import { Lock, LockOpen, Close, HelpOutline } from '@mui/icons-material';
import { KpStructure } from "../../../shared/kp/kp_class.js";
import { PartialDeep } from "type-fest";
import { UtcDatePicker } from "../../util.js";
import { getMemoUpdateFunctions, parseDate } from "../../../shared/util.js";
import { getAttendance } from "../../../shared/attendance/attendance.js";
import { AttendanceStructure } from "../../../shared/attendance/attendanceStructure.js";
import { differenceInYears } from "date-fns";
import { ConsentStructure } from "../../../shared/consents/consents_class.js";
import { SheetsWidget } from "./sheetsInput.js";
import { SuspenseElement } from "../../suspense.js";

export function ParticipantsForm({ event, attendanceConfig, basic, participants, update, kp, consent }: { event: JsonEventType, attendanceConfig: AttendanceStructure, basic:JsonBookingType["basic"], participants: Array<PartialDeep<JsonParticipantType>>, update: any, kp: KpStructure, consent: ConsentStructure }) {

    const { addEmptyObjectToArray, updateArrayItem, deleteArrayItem } = getMemoUpdateFunctions(update('participants'))

    const deleteParticipant = React.useCallback((i, name) => e => {
        if (confirm(`Are you sure you want to remove ${name || ''}?`)) {
            deleteArrayItem(i)
        }
        e.preventDefault()
    }, [])

    const participantsList = participants.map((p, i) => (<MemoParticipantForm key={i} index={i} event={event} attendanceConfig={attendanceConfig} participant={p} kp={kp} consent={consent} updateArrayItem={updateArrayItem} deleteParticipant={deleteParticipant} />))

    return <Grid container spacing={0} sx={{ mt: 2 }}>
        <Grid xs={12} p={0} item>
            <Typography variant="h6">Campers</Typography>
            {event.bigCampMode ? <SuspenseElement><SheetsWidget event={event} update={update} basic={basic} /></SuspenseElement> : null}
            {participantsList}
            <Button sx={{ mt: 2 }} variant="contained" onClick={addEmptyObjectToArray}>
                Add person
            </Button>
        </Grid>
    </Grid>
}

function ParticipantForm({ index, event, attendanceConfig, participant, kp, consent, updateArrayItem, deleteParticipant }: { index: number, event: JsonEventType, attendanceConfig: AttendanceStructure, participant: PartialDeep<JsonParticipantType>, kp: KpStructure, consent: ConsentStructure, updateArrayItem: any, deleteParticipant: any }) {

    const { updateSubField } = getMemoUpdateFunctions(updateArrayItem(index))
    const basicUpdates = getMemoUpdateFunctions(updateSubField('basic'))

    const [deleteLock, setDeleteLock] = useState(true)

    let emailAndOptionsAttendance

    if (event.attendanceStructure == "options") {
        if (event.allParticipantEmails) {
            emailAndOptionsAttendance = <>
                <Grid sm={8} xs={12} item>
                    <MemoEmailField index={index} email={participant.basic?.email} event={event} dob={participant.basic?.dob} update={basicUpdates} />
                </Grid>
                <Grid sm={4} xs={12} item>
                    <attendanceConfig.ParticipantElement configuration={event.attendanceData} data={participant.attendance} update={updateSubField} />
                </Grid>
            </>
        } else {
            emailAndOptionsAttendance = <Grid xs={12} item>
                <attendanceConfig.ParticipantElement configuration={event.attendanceData} data={participant.attendance} update={updateSubField} />
            </Grid>
        }
    } else {
        if (event.allParticipantEmails) {
            emailAndOptionsAttendance = <Grid xs={12} item>
                <MemoEmailField index={index} email={participant.basic?.email} event={event} dob={participant.basic?.dob} update={basicUpdates} />
            </Grid>
        } else {
            emailAndOptionsAttendance = null
        }
    }


    return <Paper elevation={3} sx={{ mt: 2 }} id={`P${index}`}>
        <Box p={2}>
            <Grid container spacing={2}>
                <Grid sm={8} xs={12} item>
                    <TextField
                        autoComplete={`section-${index}-participant name`}
                        inputProps={{'data-form-type': 'other'}} 
                        fullWidth
                        required
                        name={`${index}-participant-name`}
                        id={`${index}-participant-name`}
                        label="Name"
                        value={participant.basic?.name || ''}
                        onChange={basicUpdates.updateField('name')} />
                </Grid>
                <Grid sm={4} xs={12} item>
                    <UtcDatePicker
                        label="DoB *"
                        value={participant.basic?.dob}
                        onChange={basicUpdates.updateDate('dob')}
                        slotProps={{ field: { autoComplete: "off" } }}
                    />
                </Grid>
                {emailAndOptionsAttendance}
                <Grid xs={12} item>
                    <Divider >Diet</Divider>
                    <kp.ParticipantFormElement index={index} data={participant.kp || {}} update={updateSubField('kp')} />
                </Grid>
                <Grid xs={12} item>
                    <Divider />
                    <ParicipantMedicalForm index={index} event={event} data={participant.medical || {}} update={updateSubField('medical')} />
                </Grid>
                <Grid xs={12} item>
                    <Divider />
                    <consent.ParticipantFormElement event={event} data={participant.consent || {}} basic={participant.basic || {}} update={updateSubField('consent')} />
                </Grid>
                {/*}Grid xs={12} item>
                    <FormControlLabel control={<Switch checked={participant.consent?.photo as boolean || false} onChange={getMemoUpdateFunctions(updateSubField('consent')).updateSwitch('photo')} />} label="Photo Consent" />
</Grid>*/}
                <Grid xs={12} item>
                    <Box display="flex" justifyContent="flex-end">
                        <IconButton color="warning" onClick={e => setDeleteLock(d => !d)}>{deleteLock ? <Lock /> : <LockOpen />}</IconButton>
                        <IconButton color="error" disabled={deleteLock} onClick={deleteParticipant(index, participant.basic?.name)}><Close /></IconButton>
                    </Box>
                </Grid>
            </Grid>
        </Box >
    </Paper >
}

const MemoParticipantForm = React.memo(ParticipantForm)

function ParicipantMedicalForm({ index, event, data, update }: { index: number, event: JsonEventType, data: any, update: any }) {

    const { updateField } = getMemoUpdateFunctions(update)

    return <>
        <TextField
            autoComplete={`section-${index}-participant medical`}
            sx={{ mt: 2 }}
            multiline
            fullWidth
            minRows={2}
            name={`${index}-participant-medical`}
            id={`${index}-participant-medical`}
            inputProps={{'data-form-type': 'other'}} 
            label="Additional medical information, medication taken or accessibility requirements:"
            value={data.details || ''}
            onChange={updateField('details')}
            InputProps={event.bigCampMode ? {
                endAdornment: <InputAdornment position="end">
                    <Tooltip title={`LONG WORDAGE HERE`}>
                        <IconButton
                            aria-label="help tooltip"
                            edge="end"
                        >
                            <HelpOutline />
                        </IconButton>
                    </Tooltip>
                </InputAdornment>,
                sx: { alignItems: "flex-start" }
            } : {}}
        />
    </>
}

const EmailField = ({ index, email, dob, event, update }: { index: number, email: Partial<Required<JsonParticipantType>["basic"]>["email"], dob: string | undefined, event: JsonEventType, update: any }) => {
    const inputProps = {
        endAdornment: <InputAdornment position="end">
            <Tooltip title={`We will use this email address to contact campers with updates about camp and verify Woodcraft Folk membership.`}>
                <IconButton
                    aria-label="toggle password visibility"
                    edge="end"
                >
                    <HelpOutline />
                </IconButton>
            </Tooltip>
        </InputAdornment>,
    }

    if (dob && differenceInYears(parseDate(event.startDate)!, parseDate(dob)!) < 16) {
        return <TextField
            autoComplete={`section-${index}-participant email`}
            fullWidth
            required
            name={`${index}-participant-email`}
            id={`${index}-participant-email`}
            inputProps={{'data-form-type': 'other'}} 
            type="email"
            label="Parent/Guardian email"
            value={email || ''}
            onChange={update.updateField('email')}
            InputProps={inputProps} />
    } else {
        return <TextField
            autoComplete={`section-${index}-participant email`}
            fullWidth
            required
            name={`${index}-participant-email`}
            id={`${index}-participant-email`}
            inputProps={{'data-form-type': 'other'}} 
            type="email"
            label="Email"
            value={email || ''}
            onChange={update.updateField('email')}
            InputProps={inputProps} />
    }
}

const MemoEmailField = React.memo(EmailField)