import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, ButtonGroup, Stack, IconButton, Card, CardContent, Grow, Checkbox, Alert, AlertTitle } from "@mui/material"
import React, { useCallback, useContext, useState } from "react";
import { JsonBookingType, JsonEventType, JsonUserResponseType, UserResponseType, UserType } from "../../../lambda-common/onetable.js";
import { ParticipantsForm } from "./participants.js";
import { kp } from "../../../shared/kp/kp.js"
import { QuickList } from "./quickList.js";
import { MemoEmergencyFields } from "./emergency.js";
import { MemoCustomQuestionFields } from "./custom.js";
import { MemoBookingMoneySection } from "./money.js";
import { getFee } from "../../../shared/fee/fee.js";
import { MemoBookingPermissionSection } from "./permission.js";
import { BookingValidationResults, validate } from "./validation.js";
import { Lock, LockOpen, Delete, Send } from '@mui/icons-material';
import { getMemoUpdateFunctions } from "../../../shared/util.js";
import { LoadingButton } from '@mui/lab'
import { PartialDeep } from "type-fest";
import { getAttendance } from "../../../shared/attendance/attendance.js";
import { organisations } from "../../../shared/ifm.js";
import { MemoBookingExtraContactFields } from "./extraContacts.js";
import { MemoCampingFields } from "./camping.js";
import { consent } from "../../../shared/consents/consent.js";

const MemoParticipantsForm = React.memo(ParticipantsForm)

export function BookingForm({ data, event, user, update, submit, mode, deleteBooking, submitLoading, deleteLoading }: { data: PartialDeep<JsonBookingType>, event: JsonEventType, user: JsonUserResponseType, update: React.Dispatch<React.SetStateAction<PartialDeep<JsonBookingType>>>, submit: () => void, mode: "create" | "edit" | "rebook", deleteBooking: any, submitLoading: boolean, deleteLoading: boolean }) {

    const [permission, updatePermission] = useState({ permission: false })
    const [deleteLock, setDeleteLock] = useState(true)
    const { updateSubField } = getMemoUpdateFunctions(update)

    const create = useCallback(e => {
        submit()
        e.preventDefault()
    }, [submit])

    const fee = getFee(event)

    const BasicFields = event.bigCampMode ? MemoBookingGroupContactFields : MemoBookingIndvidualContactFields
    const kpConfig = React.useMemo(() => kp[event.kpMode] || kp.basic, [event]);
    const consentConfig = React.useMemo(() => consent[event.consentMode] || consent.none, [event]);
    const attendanceConfig = React.useMemo(() => getAttendance(event), [event]);

    const validationResults = validate(event, kpConfig, consentConfig, attendanceConfig, data, permission.permission)
    return <Grid container spacing={2} p={2} justifyContent="center">
        <Grid xl={6} lg={7} md={8} sm={9} xs={12} item>
            <Box p={2}>
                <form>
                    <Typography variant="h4">{`Booking for ${event.name}`}</Typography>
                    <BasicFields data={data.basic} update={updateSubField} />
                    {event.bigCampMode ? <MemoBookingExtraContactFields data={data.extraContacts} update={updateSubField} /> : null}
                    <MemoParticipantsForm basic={data.basic as JsonBookingType["basic"]} event={event} attendanceConfig={attendanceConfig} participants={data.participants || [{}]} update={updateSubField} kp={kpConfig} consent={consentConfig} />
                    <MemoCampingFields event={event} data={data.camping} update={updateSubField} />
                    <MemoEmergencyFields event={event} data={data.emergency} bookingType={data.basic?.bookingType || "individual"} update={updateSubField} />
                    <MemoCustomQuestionFields event={event} data={data.customQuestions} basic={data.basic} update={updateSubField} />
                    <MemoBookingMoneySection fees={fee} event={event} data={data} />
                    <MemoBookingPermissionSection event={event} data={permission} update={updatePermission} />
                    <BookingValidationResults validationResults={validationResults} />
                    <Stack direction="row" spacing={1} mt={2}>
                        <LoadingButton
                            onClick={create}
                            endIcon={<Send />}
                            loading={submitLoading}
                            loadingPosition="end"
                            variant="contained"
                            disabled={validationResults.length > 0}
                        >
                            <span>Submit</span>
                        </LoadingButton>
                        {mode === "edit" ? <><LoadingButton loading={deleteLoading} variant="contained" color="error" disabled={deleteLock} onClick={deleteBooking} startIcon={<Delete />}>Cancel Booking</LoadingButton>
                            <IconButton color="warning" onClick={() => setDeleteLock(!deleteLock)}>{deleteLock ? <Lock /> : <LockOpen />}</IconButton></> : null}
                    </Stack>
                </form>
            </Box>
        </Grid>
        <QuickList participants={data.participants || []} event={event} />
    </Grid>
}

function bookingIndvidualContactFields({ data, update }: { data: PartialDeep<JsonBookingType>["basic"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('basic'))

    return <>
        <Typography variant="h6" mt={2}>{`Your details`}</Typography>
        <TextField autoComplete="name" name="name" id="name" inputProps={{'data-form-type': 'name'}} fullWidth sx={{ mt: 2 }} required label="Your Name" value={data?.contactName || ''} onChange={updateField('contactName')} />
        <TextField autoComplete="email" name="email" id="email" inputProps={{'data-form-type': 'email'}} fullWidth sx={{ mt: 2 }} required type="email" label="Your email" value={data?.contactEmail || ''} onChange={updateField('contactEmail')} />
        {data?.contactEmail?.includes("privaterelay.appleid.com") ? <Alert severity="warning" sx={{ mt: 2, pt: 2 }}>
            <AlertTitle>This appears to be an Apple private relay address, we recommend you provide your actual email address, otherwise we may be unable to contact you.</AlertTitle>
        </Alert> : null}
        <TextField autoComplete="tel" name="telephone" id="telephone" inputProps={{'data-form-type': 'phone'}} fullWidth sx={{ mt: 2 }} required type="tel" label="Phone Number" value={data?.contactPhone || ''} onChange={updateField('contactPhone')} />
    </>
}

function bookingGroupContactFields({ data, update }: { data: PartialDeep<JsonBookingType>["basic"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('basic'))

    const selectedStyle = { borderColor: "success.dark", backgroundColor: "success.light", color: "success.contrastText", cursor: "pointer" }
    const unselectedStyle = { borderColor: "divider.main", backgroundColor: "background.default", cursor: "pointer" }

    const groupStyle = data?.bookingType == "group" ? selectedStyle : unselectedStyle
    const individualStyle = data?.bookingType == "individual" ? selectedStyle : unselectedStyle

    const organsationItems = organisations.map((o, i) => {
        return <MenuItem key={i} value={o}>
            {o}
        </MenuItem>
    })

    return <>
        <Typography variant="h6" mt={2}>{`Booking Type`}</Typography>
        <Typography variant="body1">Please select the type of booking you are making:</Typography>
        <Grid container spacing={2} mt={1}>
            <Grid xs={6} item>
                <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...groupStyle }} onClick={() => update('basic')(data => { return { ...data, bookingType: 'group' } })}>
                    <CardContent>
                        <Checkbox checked={data?.bookingType == "group"} sx={{ float: 'right', mt: -1, mr: -1 }} />
                        <Typography variant="h5">Group Booking</Typography>
                        <Typography variant="body1">If you are booking for a Woodcraft Folk District, Group, or other large booking, please select this option.</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid xs={6} item>
                <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...individualStyle }} onClick={() => update('basic')(data => { return { ...data, bookingType: 'individual' } })}>
                    <CardContent>
                        <Checkbox checked={data?.bookingType == "individual"} sx={{ float: 'right', mt: -1, mr: -1 }} />
                        <Typography variant="h5">Individual Booking</Typography>
                        <Typography variant="body1">If you are booking just yourself or your family members, please select this option.</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
        <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="organisation-select-label">Organisation</InputLabel>
            <Select
                labelId="organisation-select-label"
                id="organisation-select"
                label="Organisation"
                value={data?.organisation || "select"}
                onChange={updateField("organisation")}>
                {!data?.organisation ? <MenuItem key="select" value="select">Please select</MenuItem> : null}
                {organsationItems}
            </Select>
        </FormControl>
        <TextField autoComplete="off" name="group" id="group" inputProps={{'data-form-type': 'other'}} fullWidth sx={{ mt: 2 }} required label="District" value={data?.district || ''} onChange={updateField('district')} />
        <Typography variant="h6" mt={2}>{`Your details`}</Typography>
        <TextField autoComplete="name" name="name" id="name" inputProps={{'data-form-type': 'name'}} fullWidth sx={{ mt: 2 }} required label="Your Name" value={data?.contactName || ''} onChange={updateField('contactName')} />
        <TextField autoComplete="email" name="email" id="email" inputProps={{'data-form-type': 'email'}} fullWidth sx={{ mt: 2 }} required type="email" label="Your email" value={data?.contactEmail || ''} onChange={updateField('contactEmail')} />
        {data?.contactEmail?.includes("privaterelay.appleid.com") ? <Alert severity="warning" sx={{ mt: 2, pt: 2 }}>
            <AlertTitle>This appears to be an Apple private relay address, we recommend you provide your actual email address, otherwise we may be unable to contact you.</AlertTitle>
        </Alert> : null}
        <TextField autoComplete="tel" name="telephone" id="telephone" inputProps={{'data-form-type': 'phone'}} fullWidth sx={{ mt: 2 }} required type="tel" label="Phone Number" value={data?.contactPhone || ''} onChange={updateField('contactPhone')} />
    </>
}

const MemoBookingIndvidualContactFields = React.memo(bookingIndvidualContactFields)
const MemoBookingGroupContactFields = React.memo(bookingGroupContactFields)