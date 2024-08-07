import React, { useCallback, useContext, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Button, FormControl, Grid, IconButton, InputLabel, MenuItem, Modal, Paper, Select, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { Close, ContentCopy, Email } from "@mui/icons-material";
import { getMemoUpdateFunctions } from "../../shared/util.js";
import { eventRolesQuery, useBookingOperation, useEventOperation } from "../queries.js";
import { applicationTypeIcon } from "./utils.js";
import { groupParticipants } from "../../shared/woodcraft.js";

export function Component() {
    const { event, bookings: rawBookings, displayDeleted } = useOutletContext<managePageContext>()

    const [newVillage, setNewVillage] = useState({ name: "", town: "" })
    const { updateField } = getMemoUpdateFunctions(setNewVillage)

    const eventOperation = useEventOperation(event.id)
    const bookingOperation = useBookingOperation()

    const submit = e => {
        eventOperation.mutate({ operation: { type: "addVillage", name: newVillage.name, town: newVillage.town } })
        e.preventDefault()
    }

    const removeVillage = name => e => {
        eventOperation.mutate({ operation: { type: "removeVillage", name: name } })
        e.preventDefault()
    }

    const newEnabled = newVillage.name && newVillage.town && !event.villages?.find(v => v.name === newVillage.name)

    const unassignVillage = userId => e => {
        bookingOperation.mutate({ eventId: event.id, userId: userId, operation: { type: "unassignVillage", village: e.target.value } })
    }

    const rows = event.villages?.map((v, i) => {
        const bookingsInVillage = rawBookings.filter(b => b.village === v.name && !b.deleted)
        const participants = bookingsInVillage.reduce<JsonParticipantWithExtraType[]>((a, c) => {
            return [...a, ...c.participants]
        }, [])
        const totalsString = groupParticipants(participants, event).filter(g => g.participants.length > 0).map(g => `${g.group.name}: ${g.participants.length}`).join(", ")

        const tableRows = bookingsInVillage.map((b, i) => {
            return <TableRow key={i}>
                <TableCell>{b.basic.bookingType === "group" ? b.basic.district : b.basic.contactName}</TableCell>
                <TableCell>{b.participants.length}</TableCell>
                <TableCell>
                    <IconButton disabled={bookingOperation.isPending} onClick={unassignVillage(b.userId)} color="warning">
                        <Close />
                    </IconButton>
                </TableCell>
            </TableRow>
        })
        return <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="td" scope="row">
                <Stack alignItems="center" gap={1} direction="row">{v.name}
                    <IconButton disabled={eventOperation.isPending} color="warning" onClick={removeVillage(v.name)} className="hidden-button">
                        <Close />
                    </IconButton>
                </Stack>
            </TableCell>
            <TableCell component="td">{v.town}</TableCell>
            <TableCell component="td">
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableBody>
                            {tableRows}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Typography variant="body1" sx={{ mt: 1 }} color={t => participants.length < 80 ? t.palette.success.main : participants.length < 90 ? t.palette.warning.main : t.palette.error.main }>Total: {participants.length} {totalsString}</Typography>
            </TableCell>
        </TableRow>
    })

    const menuItems = event.villages?.map((v, i) => {
        return <MenuItem key={i} value={v.name}>{v.name}</MenuItem>
    })

    const assignVillage = userId => e => {
        bookingOperation.mutate({ eventId: event.id, userId: userId, operation: { type: "assignVillage", village: e.target.value } })
    }

    const bookingVillages = rawBookings.filter(b => !event.villages?.find(v => v.name === b.village) && !b.deleted).map((b, i) => {
        return <Paper sx={{ p: 2 }} key={i}>
            <Stack alignItems="center" gap={1} direction="row"><Typography variant="h6">
                {b.basic.bookingType === "group" ? b.basic.district : b.basic.contactName}
            </Typography>
                {applicationTypeIcon(b.basic.bookingType)}
            </Stack>
            <Typography sx={{ mt: 1 }} variant="body2"><b>Campers:</b> {b.participants.length}</Typography>
            <Typography sx={{ mt: 1 }} variant="body2">{b.camping?.campWith}</Typography>
            <Typography sx={{ mt: 1 }} variant="body2">{b.camping?.canBringEquipment}</Typography>
            <Typography sx={{ mt: 1 }} variant="body2">{b.camping?.accessibilityNeeds}</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id={`select-village-${i}`}>Village</InputLabel>
                <Select label="Villages" onChange={assignVillage(b.userId)} labelId={`select-village-${i}`} disabled={bookingOperation.isPending}>
                    {menuItems}
                </Select>
            </FormControl>
        </Paper>
    })

    return <Grid container spacing={2} p={2}>
        <Grid item xs={5}>
            <TextField label="Name" value={newVillage.name} onChange={updateField("name")} fullWidth />
        </Grid>
        <Grid item xs={5}>
            <TextField label="Town" value={newVillage.town} onChange={updateField("town")} fullWidth />
        </Grid>
        <Grid item xs={2}>
            <Button disabled={!newEnabled} onClick={submit}>Add Village</Button>
        </Grid>
        <Grid item xs={4}>
            {bookingVillages}
        </Grid>
        <Grid item xs={8}>
            <TableContainer component={Paper}>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Town</strong></TableCell>
                            <TableCell><strong>Bookings</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows}
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>
    </Grid>
}

