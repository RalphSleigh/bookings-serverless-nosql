import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Button, Grid, IconButton, Modal, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { ContentCopy, Email } from "@mui/icons-material";

export function Component() {
    const { event, bookings: rawBookings, displayDeleted } = useOutletContext<managePageContext>()
    const bookings = rawBookings.filter(b => !b.deleted)

    const allEmails = bookings.map(b => emailString(b)).join(", ")


    const rows = bookings.map((b, i) => {
        return <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="td" scope="row">{b.basic.district ? b.basic.district : b.basic.contactName}</TableCell>
            <TableCell component="td">{emailString(b)}</TableCell>
            <TableCell component="td">
                <IconButton href={`mailto:${emailString(b)}`} target="_blank">
                    <Email />
                </IconButton>
                <IconButton onClick={() => navigator.clipboard.writeText(emailString(b))}>
                    <ContentCopy />
                </IconButton>
            </TableCell>
        </TableRow>
    })

    return <>
        <Typography sx={{ p: 2 }} variant="h6">All displayed bookings:</Typography>
        <IconButton href={`mailto:?bcc=${allEmails}`} target="_blank">
            <Email />
        </IconButton>
        <IconButton onClick={() => navigator.clipboard.writeText(allEmails)}>
            <ContentCopy />
        </IconButton>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell><strong>District</strong></TableCell>
                        <TableCell><strong>Emails</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows}
                </TableBody>
            </Table>
        </TableContainer></>
}

const emailString = (b: JsonBookingWithExtraType) => `${b.basic.contactName} <${b.basic.contactEmail}>` + (b.extraContacts ? b.extraContacts.map(c => `, ${c.name} <${c.email}>`).join("") : "")

