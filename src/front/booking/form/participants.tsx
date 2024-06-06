import { Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, IconButton, CardMedia, Divider, InputAdornment, Tooltip, Stack, Checkbox } from "@mui/material";
import React, { useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonBookingType, JsonEventType, JsonParticipantType, UserType } from "../../../lambda-common/onetable.js";
import { Lock, LockOpen, Close, HelpOutline, ExpandMore, ExpandLess, CheckCircleOutline, WarningAmber } from '@mui/icons-material';
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
import { Valid } from "aws-sdk/clients/iot.js";
import { Validation } from "./validation.js";

const COLLAPSE_DEFAULT_THRESHOLD = 20

export function ParticipantsForm({ event, attendanceConfig, basic, participants, update, kp, consent, validation }: { event: JsonEventType, attendanceConfig: AttendanceStructure, basic: JsonBookingType["basic"], participants: Array<PartialDeep<JsonParticipantType>>, update: any, kp: KpStructure, consent: ConsentStructure, validation: Validation }) {

    const { addEmptyObjectToArray, updateArrayItem, deleteArrayItem } = getMemoUpdateFunctions(update('participants'))

    const deleteParticipant = React.useCallback((i, name) => e => {
        if (confirm(`Are you sure you want to remove ${name || ''}?`)) {
            deleteArrayItem(i)
        }
        e.preventDefault()
    }, [])

    const [incomingParticipants, setIncomingParticipants] = useState(0)
    const defaultCollapse = Math.max(participants.length, incomingParticipants) > COLLAPSE_DEFAULT_THRESHOLD

    const participantsList = participants.map((p, i) => (<MemoParticipantForm key={i} index={i} event={event} attendanceConfig={attendanceConfig} participant={p} kp={kp} consent={consent} updateArrayItem={updateArrayItem} deleteParticipant={deleteParticipant} defaultCollapse={defaultCollapse} validation={validation} />))

    return <Grid container spacing={0} sx={{ mt: 2 }}>
        <Grid xs={12} p={0} item>
            <Typography variant="h6">Campers</Typography>
            {event.bigCampMode ? <SuspenseElement><SheetsWidget event={event} update={update} basic={basic} setIncomingParticipants={setIncomingParticipants} /></SuspenseElement> : null}
            {participantsList}
            <Button sx={{ mt: 2 }} variant="contained" onClick={addEmptyObjectToArray}>
                Add person
            </Button>
        </Grid>
    </Grid>
}

function ParticipantForm({ index,
    event,
    attendanceConfig,
    participant,
    kp,
    consent,
    updateArrayItem,
    deleteParticipant,
    defaultCollapse = false,
    validation }:
    {
        index: number,
        event: JsonEventType,
        attendanceConfig: AttendanceStructure,
        participant: PartialDeep<JsonParticipantType>,
        kp: KpStructure,
        consent: ConsentStructure,
        updateArrayItem: any,
        deleteParticipant: any,
        defaultCollapse: boolean,
        validation: Validation
    }) {

    const { updateSubField } = getMemoUpdateFunctions(updateArrayItem(index))
    const basicUpdates = getMemoUpdateFunctions(updateSubField('basic'))
    const updateSwitch = getMemoUpdateFunctions(updateSubField('medical')).updateSwitch

    const [deleteLock, setDeleteLock] = useState(true)
    const [collapse, setCollapse] = useState(defaultCollapse)


    if (collapse) {
        const valid = validation.validateParticipant(participant, index).length == 0
        return <Paper variant="outlined" sx={{ mt: 2, cursor: '' }} id={`P${index}`} onClick={e => setCollapse(false)}>
            <Box p={2} display="flex"
                alignItems="center">
                <Stack direction="row" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
                    {valid ? <CheckCircleOutline color="success" sx={{ verticalAlign: "middle" }} /> : <WarningAmber color="warning" sx={{ verticalAlign: "middle" }} />}
                    <Typography variant="h6" sx={{ flexGrow: 1, pr: 2, }}>{participant.basic?.name}</Typography>
                </Stack>
                <IconButton><ExpandMore /></IconButton>
            </Box>
        </Paper>
    }

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

    const dob = participant.basic?.dob

    return <Paper elevation={3} sx={{ mt: 2 }} id={`P${index}`}>
        <Box p={2}>
            <Grid container spacing={2}>
                <Grid sm={8} xs={12} item>
                    <TextField
                        autoComplete={`section-${index}-participant name`}
                        inputProps={{ 'data-form-type': 'other' }}
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
                {dob && differenceInYears(parseDate(event.startDate)!, parseDate(dob)!) >= 18 ? <Grid xs={12} item>
                    <FormControlLabel checked={participant.medical?.firstAid || false} onChange={updateSwitch('firstAid')} control={<Checkbox />} label="First Aider (18+ only)" />
                </Grid>
                    : null}
                <Grid xs={12} item>
                    <Divider >Diet</Divider>
                    <kp.ParticipantFormElement index={index} data={participant.kp || {}} update={updateSubField('kp')} />
                </Grid>
                <Grid xs={12} item>
                    <Divider>Medical & Accessbility</Divider>
                    <ParicipantMedicalForm index={index} event={event} data={participant.medical || {}} update={updateSubField('medical')} />
                </Grid>
                <Grid xs={12} item>
                    <Divider>Consent</Divider>
                    <consent.ParticipantFormElement event={event} data={participant.consent || {}} basic={participant.basic || {}} update={updateSubField('consent')} />
                </Grid>
                {/*}Grid xs={12} item>
                    <FormControlLabel control={<Switch checked={participant.consent?.photo as boolean || false} onChange={getMemoUpdateFunctions(updateSubField('consent')).updateSwitch('photo')} />} label="Photo Consent" />
</Grid>*/}
                <Grid xs={12} item>
                    <Box display="flex" justifyContent="flex-end">
                        <IconButton onClick={() => setCollapse(true)}><ExpandLess /></IconButton>
                        <IconButton color="warning" onClick={e => setDeleteLock(d => !d)}>{deleteLock ? <Lock /> : <LockOpen />}</IconButton>
                        <IconButton color="error" disabled={deleteLock} onClick={deleteParticipant(index, participant.basic?.name)}><Close /></IconButton>
                    </Box>
                </Grid>
            </Grid>
        </Box >
    </Paper >
}

const MemoParticipantForm = React.memo(ParticipantForm)

function ParicipantMedicalForm({ index, event, data, update }: { index: number, event: JsonEventType, data: PartialDeep<JsonParticipantType>["medical"], update: any }) {

    const { updateField, updateSwitch } = getMemoUpdateFunctions(update)

    if (!event.bigCampMode) {
        return <>
            <TextField
                autoComplete={`section-${index}-participant medical`}
                sx={{ mt: 2 }}
                multiline
                fullWidth
                minRows={2}
                name={`${index}-participant-medical`}
                id={`${index}-participant-medical`}
                inputProps={{ 'data-form-type': 'other' }}
                label="Please provide us with details of medical conditions, medication or additional needs:"
                value={data?.details || ''}
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
    } else {
        return <>
            <TextField
                autoComplete={`section-${index}-participant medical`}
                sx={{ mt: 2 }}
                multiline
                fullWidth
                minRows={2}
                name={`${index}-participant-medical`}
                id={`${index}-participant-medical`}
                inputProps={{ 'data-form-type': 'other' }}
                label="Medical conditions, medication or additional needs:"
                value={data?.details || ''}
                onChange={updateField('details')}
            />
            <Typography variant="body2" sx={{ mt: 2 }}>Please provide us with details of any accessibility requirements, this may include mobility issues, a requirement for power or other access requirements</Typography>
            <TextField
                autoComplete={`section-${index}-participant accessibility`}
                sx={{ mt: 2 }}
                multiline
                fullWidth
                minRows={2}
                name={`${index}-participant-accessibility`}
                id={`${index}-participant-accessibility`}
                inputProps={{ 'data-form-type': 'other' }}
                label="Accessibility requirements:"
                value={data?.accessibility || ''}
                onChange={updateField('accessibility')}
                InputProps={event.bigCampMode ? {
                    endAdornment: <InputAdornment position="end">
                        <Tooltip title={`This is so we can best support all campers throughout Camp 100`}>
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
            <FormControlLabel checked={data?.contactMe || false} onChange={updateSwitch('contactMe')} control={<Checkbox />} label="I would like to talk to the accessibility team about my accessibility requirements" />
        </>
    }
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
            inputProps={{ 'data-form-type': 'other' }}
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
            inputProps={{ 'data-form-type': 'other' }}
            type="email"
            label="Email"
            value={email || ''}
            onChange={update.updateField('email')}
            InputProps={inputProps} />
    }
}

const MemoEmailField = React.memo(EmailField)