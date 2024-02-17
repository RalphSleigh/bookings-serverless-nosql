import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, ButtonGroup, Stack, IconButton } from "@mui/material"
import React, { useCallback, useContext, useState } from "react";
import { JsonBookingType, JsonEventType, UserType } from "../../../lambda-common/onetable.js";
import { ParticipantsForm } from "./participants.js";
import { kp } from "../../../shared/kp/kp.js"
import { QuickList } from "./quickList.js";
import { MemoBookingGroupEmergenecyFields, MemoBookingIndvidualEmergencyFields } from "./emergency.js";
import { MemoCustomQuestionFields } from "./custom.js";
import { MemoBookingMoneySection } from "./money.js";
import { getFee } from "../../../shared/fee/fee.js";
import { MemoBookingPermissionSection } from "./permission.js";
import { BookingValidationResults, validate } from "./validation.js";
import { Lock, LockOpen, Delete, Send } from '@mui/icons-material';
import { getMemoUpdateFunctions } from "../../../shared/util.js";
import { LoadingButton } from '@mui/lab'

const MemoParticipantsForm = React.memo(ParticipantsForm)

export function BookingForm({ data, event, user, update, submit, mode, deleteBooking, submitLoading, deleteLoading }: { data: Partial<JsonBookingType>, event: JsonEventType, user: UserType, update: React.Dispatch<React.SetStateAction<Partial<JsonBookingType>>>, submit: () => void, mode: "create" | "edit" | "rebook", deleteBooking: any, submitLoading: boolean, deleteLoading: boolean }) {

    const [permission, updatePermission] = useState({ permission: false })
    const [deleteLock, setDeleteLock] = useState(true)
    const { updateSubField } = getMemoUpdateFunctions(update)

    const create = useCallback(e => {
        submit()
        e.preventDefault()
    }, [submit])

    const fee = getFee(event)

    const BasicFields = event.bigCampMode ? MemoBookingGroupContactFields : MemoBookingIndvidualContactFields
    const EmergencyFields = event.bigCampMode ? MemoBookingGroupEmergenecyFields : MemoBookingIndvidualEmergencyFields
    const kpConfig = React.useMemo(() => kp[event.kpMode] || kp.basic, [event]);

    const validationResults = validate(event, kpConfig, data, permission.permission)
    return <Grid container spacing={2} p={2}>
        <Grid sm={9} xs={12} item>
            <Box p={2}>
                <form>
                    <Typography variant="h4">{`Booking for ${event.name}`}</Typography>
                    <BasicFields data={data.basic} update={updateSubField} />
                    <MemoParticipantsForm participants={data.participants || [{}]} update={updateSubField} kp={kpConfig} />
                    <EmergencyFields data={data.emergency} update={updateSubField} />
                    <MemoCustomQuestionFields eventCustomQuestions={event.customQuestions} data={data.customQuestions} update={updateSubField} />
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

function bookingIndvidualContactFields({ data, update }: { data: Partial<JsonBookingType>["basic"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('basic'))

    return <>
        <Typography variant="h6" mt={2}>{`Your details`}</Typography>
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Your Name" value={data?.contactName || ''} onChange={updateField('contactName')} />
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" type="email" label="Your email" value={data?.contactEmail || ''} onChange={updateField('contactEmail')} />
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" type="tel" label="Phone Number" value={data?.contactPhone || ''} onChange={updateField('contactPhone')} />
    </>
}

function bookingGroupContactFields({ data, update }: { data: Partial<JsonBookingType>["basic"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('basic'))

    return <>
        <Typography variant="h6" mt={2}>{`Your details`}</Typography>
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Your Name" value={data?.contactName || ''} onChange={updateField('contactName')} />
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" type="email" label="Your email" value={data?.contactEmail || ''} onChange={updateField('contactEmail')} />
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" type="tel" label="Phone Number" value={data?.contactPhone || ''} onChange={updateField('contactPhone')} />
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="District" value={data?.district || ''} onChange={updateField('district')} />
    </>
}

const MemoBookingIndvidualContactFields = React.memo(bookingIndvidualContactFields)
const MemoBookingGroupContactFields = React.memo(bookingGroupContactFields)