import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, Fab } from "@mui/material";
import React, { useContext, useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, JsonParticipantType, UserType } from "../../../lambda-common/onetable.js";
import { cloneDeep, merge } from 'lodash'
import { Close } from '@mui/icons-material';
import { KpStructure } from "../../../shared/kp/kp_class.js";
import { PartialDeep } from "type-fest";

export function ParticipantsForm({ participants, update, kp }: { participants: Array<PartialDeep<JsonParticipantType>>, update: any, kp: KpStructure }) {

    const addNewParticipant = e => {
        update([...participants, {}])
    }

    const updateParticipant = i => section => field => value=> {
        const newParticipants = cloneDeep(participants)
        const participantToUpdate = newParticipants[i]
        merge(participantToUpdate, {[section]: {[field]: value}})
        update(newParticipants)
    }

    const deleteParticipant = i => e => {
        if (confirm(`Are you sure you want to remove ${participants[i]?.basic?.name || ''}?`)) {
            const newParticipants = cloneDeep(participants)
            newParticipants.splice(i, 1)
            update(newParticipants)
        }
        e.preventDefault()
    }

    const participantsList = participants.map((p, i) => <ParticipantForm key={i} participant={p} kp={kp} update={updateParticipant(i)} deleteParticipant={deleteParticipant(i)} />)

    return <Grid container spacing={0} sx={{ mt: 2 }}>
        <Grid xs={12} p={0} item>
            <Typography variant="h4">Hmmm</Typography>
            {participantsList}
            <Button sx={{ mt: 2 }} variant="contained" onClick={addNewParticipant}>Add Participant</Button>
        </Grid>
    </Grid>
}

function ParticipantForm({ participant, kp, update, deleteParticipant }: { participant: PartialDeep<JsonParticipantType>, kp: KpStructure, update: any, deleteParticipant: any }) {

    const updateParticipantField = section => field => e => {
        update(section)(field)(e.target.value)
        e.preventDefault()
    }

    return <Paper elevation={6} sx={{ mt: 2 }}>
        <Box p={2}>
            <Fab sx={{ float: "right"}} size="small" color="error" aria-label="add" onClick={deleteParticipant}>
                <Close />
            </Fab>
            <Typography variant="h4">Hmmm</Typography>
            <FormGroup>
                <TextField sx={{ mt: 2 }} required id="outlined-required" label="Name" value={participant.basic?.name || ''} onChange={updateParticipantField('basic')('name')} />
                <kp.ParticipantFormElement data={participant.kp || {}} update={update('kp')} />
            </FormGroup>
        </Box>
    </Paper>

}