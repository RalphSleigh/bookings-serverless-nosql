import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, Fab } from "@mui/material";
import React, { useContext, useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonParticipantType, UserType } from "../../../lambda-common/onetable.js";
import { cloneDeep, merge } from 'lodash'
import { Close } from '@mui/icons-material';
import { KpStructure } from "../../../shared/kp/kp_class.js";
import { PartialDeep } from "type-fest";
import { UtcDatePicker, getMemoUpdateFunctions } from "../../util.js";

export function ParticipantsForm({ participants, update, kp }: { participants: Array<PartialDeep<JsonParticipantType>>, update: any, kp: KpStructure }) {

    const { updateField, updateSwitch, updateSubField, addEmptyObjectToArray, updateArrayItem, deleteArrayItem } = getMemoUpdateFunctions(update)

    const deleteParticipant = React.useCallback(i => e => {
        if (confirm(`Are you sure you want to remove ${participants[i]?.basic?.name || ''}?`)) {
            deleteArrayItem(i)
        }
        e.preventDefault()
    }, [])

    const participantsList = participants.map((p, i) => <MemoParticipantForm key={i} index={i} participant={p} kp={kp} updateArrayItem={updateArrayItem} deleteParticipant={deleteParticipant} />)
    
    return <Grid container spacing={0} sx={{ mt: 2 }}>
        <Grid xs={12} p={0} item>
            <Typography variant="h6">Participants</Typography>
            {participantsList}
            <Button sx={{ mt: 2 }} variant="contained" onClick={addEmptyObjectToArray}>Add Participant</Button>
        </Grid>
    </Grid>
}

function ParticipantForm({ index, participant, kp, updateArrayItem, deleteParticipant}: { index: number, participant: PartialDeep<JsonParticipantType>, kp: KpStructure, updateArrayItem: any, deleteParticipant: any }) {

    const { updateField, updateSwitch, updateParticipantDate, updateSubField } = getMemoUpdateFunctions(updateArrayItem(index))
    const basicUpdates = getMemoUpdateFunctions(updateSubField('basic'))

    return <Paper elevation={6} sx={{ mt: 2 }}>
        <Box p={2}>
            <Grid container spacing={2}>
                <Grid xs={8} item>
                    <TextField
                        fullWidth
                        required
                        id="outlined-required"
                        label="Name"
                        value={participant.basic?.name || ''}
                        onChange={basicUpdates.updateField('name')} />
                </Grid>
                <Grid xs={4} item>
                    <UtcDatePicker label="DoB *" value={participant.basic?.dob} onChange={basicUpdates.updateParticipantDate('dob')}/>
                    <Fab size="small" sx={{ml: 2}} color="error" aria-label="add" onClick={deleteParticipant(index)}>
                        <Close />
                    </Fab>
                </Grid>
                <Grid xs={12} item>
                    <kp.ParticipantFormElement data={participant.kp || {}} update={updateSubField('kp')} />
                </Grid>
                <Grid xs={12} item>
                    <ParicipantMedicalForm data={participant.medical || {}} update={updateSubField('medical')} />
                </Grid>
                <Grid xs={12} item>
                    <FormControlLabel control={<Switch checked={participant.consent?.photo as boolean || false} onChange={getMemoUpdateFunctions(updateSubField('consent')).updateSwitch('photo')} />} label="Photo Consent" />
                </Grid>
            </Grid>
        </Box >
    </Paper >
}

const MemoParticipantForm = React.memo(ParticipantForm)

function ParicipantMedicalForm({ data, update }: { data: any, update: any }) {

    const { updateField, updateSwitch, updateParticipantDate, updateSubField } = getMemoUpdateFunctions(update)

    return <>
        <TextField multiline fullWidth minRows={2} id="outlined" label="Any medication taken or other things we should be aware of?" value={data.details || ''} onChange={updateField('details')} />
    </>
}