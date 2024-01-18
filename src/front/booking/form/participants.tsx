import { Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, IconButton, CardMedia } from "@mui/material";
import React, { useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonParticipantType, UserType } from "../../../lambda-common/onetable.js";
import { Lock, LockOpen, Close } from '@mui/icons-material';
import { KpStructure } from "../../../shared/kp/kp_class.js";
import { PartialDeep } from "type-fest";
import { UtcDatePicker } from "../../util.js";
import { getMemoUpdateFunctions } from "../../../shared/util.js";

export function ParticipantsForm({ participants, update, kp }: { participants: Array<PartialDeep<JsonParticipantType>>, update: any, kp: KpStructure }) {

    const { addEmptyObjectToArray, updateArrayItem, deleteArrayItem } = getMemoUpdateFunctions(update(('participants')))

    const deleteParticipant = React.useCallback((i, name) => e => {
        if (confirm(`Are you sure you want to remove ${name || ''}?`)) {
            deleteArrayItem(i)
        }
        e.preventDefault()
    }, [])

    const participantsList = participants.map((p, i) => (<MemoParticipantForm key={i} index={i} participant={p} kp={kp} updateArrayItem={updateArrayItem} deleteParticipant={deleteParticipant} />))

    return <Grid container spacing={0} sx={{ mt: 2 }}>
        <Grid xs={12} p={0} item>
            <Typography variant="h6">Campers</Typography>
            {participantsList}
            <Button sx={{ mt: 2 }} variant="contained" onClick={addEmptyObjectToArray}>Add Participant</Button>
        </Grid>
    </Grid>
}

function ParticipantForm({ index, participant, kp, updateArrayItem, deleteParticipant }: { index: number, participant: PartialDeep<JsonParticipantType>, kp: KpStructure, updateArrayItem: any, deleteParticipant: any }) {

    const { updateSubField } = getMemoUpdateFunctions(updateArrayItem(index))
    const basicUpdates = getMemoUpdateFunctions(updateSubField('basic'))

    const [deleteLock, setDeleteLock] = useState(true)

    return <Paper elevation={3} sx={{ mt: 2 }} id={`P${index}`}>
        <Box p={2}>
            <Grid container spacing={2}>
                <Grid sm={8} xs={12} item>
                    <TextField
                        fullWidth
                        required
                        id="outlined-required"
                        label="Name"
                        value={participant.basic?.name || ''}
                        onChange={basicUpdates.updateField('name')} />
                </Grid>
                <Grid sm={4} xs={12} item>
                    <UtcDatePicker label="DoB *" value={participant.basic?.dob} onChange={basicUpdates.updateDate('dob')} />
                </Grid>
                <Grid xs={12} item>
                    <kp.ParticipantFormElement data={participant.kp || {}} update={updateSubField('kp')} />
                </Grid>
                <Grid xs={12} item>
                    <ParicipantMedicalForm data={participant.medical || {}} update={updateSubField('medical')} />
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

function ParicipantMedicalForm({ data, update }: { data: any, update: any }) {

    const { updateField } = getMemoUpdateFunctions(update)

    return <>
        <TextField multiline fullWidth minRows={2} id="outlined" label="Additional medical information & medication taken:" value={data.details || ''} onChange={updateField('details')} />
    </>
}