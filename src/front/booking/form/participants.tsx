import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, Fab } from "@mui/material";
import React, { useContext, useState } from "react";
//import { validate } from "./validate.js";
import { BookingType, UserType } from "../../../lambda-common/onetable.js";
import { cloneDeep, merge } from 'lodash'
import { Close } from '@mui/icons-material';


export function ParticipantsForm({ participants, update }: { participants: BookingType['participants'], update: any }) {

    const addNewParticipant = e => {
        update([...participants, {}])
    }

    const updateParticipant = i => section => field => e => {
        const newParticipants = cloneDeep(participants)
        const participantToUpdate = newParticipants[i]
        merge(participantToUpdate, {[section]: {[field]: e.target.value}})
        update(newParticipants)
        e.preventDefault()
    }

    const deleteParticipant = i => e => {
        if (confirm(`Are you sure you want to remove ${participants[i]?.basic?.name || ''}?`)) {
            const newParticipants = cloneDeep(participants)
            newParticipants.splice(i, 1)
            update(newParticipants)
        }
        e.preventDefault()
    }

    const participantsList = participants.map((p, i) => <ParticipantForm key={i} participant={p} update={updateParticipant(i)} deleteParticipant={deleteParticipant(i)} />)

    return <Grid container spacing={0} sx={{ mt: 2 }}>
        <Grid xs={12} p={0} item>
            <Typography variant="h4">Hmmm</Typography>
            {participantsList}
            <Button sx={{ mt: 2 }} variant="contained" onClick={addNewParticipant}>Add Participant</Button>
        </Grid>
    </Grid>
}

function ParticipantForm({ participant, update, deleteParticipant }: { participant: BookingType['participants'][0], update: any, deleteParticipant: any }) {
    return <Paper elevation={6} sx={{ mt: 2 }}>
        <Box p={2}>
            <Fab sx={{ float: "right"}} size="small" color="error" aria-label="add" onClick={deleteParticipant}>
                <Close />
            </Fab>
            <Typography variant="h4">Hmmm</Typography>
            <FormGroup>
                <TextField sx={{ mt: 2 }} required id="outlined-required" label="Name" value={participant.basic?.name || ''} onChange={update('basic')('name')} />
            </FormGroup>
        </Box>
    </Paper>

}