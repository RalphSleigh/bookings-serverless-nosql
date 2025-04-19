import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { allUsersQueryType, eventRolesQueryType, allUsersQuery, eventRolesQuery, useCreateRole, useDeleteRole, useEventApplications, eventApplicationsQueryType, eventApplicationsQuery, useApplicationOperation, useEventApplicationsSheetsNumberQuery } from "../queries.js";
import { managePageContext } from "./managePage.js";
import { useQueries, useQuery, useSuspenseQueries } from "@tanstack/react-query";
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { Avatar, AvatarGroup, Badge, Box, Button, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme } from "@mui/material";
import { Close } from "@mui/icons-material";
import { JsonUserType, RoleType } from "../../lambda-common/onetable.js";
import { applicationTypeIcon } from "./utils.js";
import { application } from "express";

export function Component() {
    const { event, bookings } = useOutletContext<managePageContext>()

    const [roleData, applicationsData] = useSuspenseQueries<[eventRolesQueryType, eventApplicationsQueryType]>({ queries: [eventRolesQuery(event.id), eventApplicationsQuery(event.id)] })
    const applicationSheetsNumbers = useEventApplicationsSheetsNumberQuery(event.id)
    const applicationOperation = useApplicationOperation(event.id)

    const approvedApplications = applicationsData.data.applications.filter(a => roleData.data.roles.find(r => (r.userId === a.userId && r.role === "Book")))
    const waitingApplications = applicationsData.data.applications.filter(a => !roleData.data.roles.find(r => (r.userId === a.userId && r.role === "Book")))

    const filteredBookings = bookings.filter(b => !b.deleted)

    const approve = (userId: string) => {
        applicationOperation.mutate({ userId, operation: {type: "approveApplication", userId: userId }})
    }

    const decline = (userId: string) => {
        if(!confirm("Are you sure you want to decline this application?")) return
        applicationOperation.mutate({ userId, operation: {type: "declineApplication", userId: userId }})
    }

    const applicationRows = waitingApplications.map((a, i) => {
        
        return <TableRow key={i}>
            <TableCell>{applicationTypeIcon(a.bookingType)}</TableCell>
            <TableCell>{a.name}</TableCell>
            <TableCell><a href={`mailto:${a.email}`}>{a.email}</a></TableCell>
            <TableCell>{a.district}</TableCell>
            <TableCell>{a.predictedParticipants}</TableCell>
            <TableCell>{a.created}</TableCell>
            <TableCell>
                <Button variant="contained" disabled={applicationOperation.isPending} onClick={() => approve(a.userId)}>Approve</Button>
            </TableCell>
            <TableCell>
                <IconButton color="warning" disabled={applicationOperation.isPending} onClick={() => decline(a.userId)}>
                    <Close />
                </IconButton>
            </TableCell>
        </TableRow>
    })

    let total = 0

    const approvedApplicationRoles = approvedApplications
    .sort((a, b) => b.predictedParticipants - a.predictedParticipants)
    .map((a, i) => {
        const booking = filteredBookings.find(b => b.userId === a.userId)
        total += Math.max(a.predictedParticipants, booking?.participants.length || 0)

        return <TableRow key={i}>
            <TableCell>{applicationTypeIcon(a.bookingType)}</TableCell>
            <TableCell>{a.name}</TableCell>
            <TableCell><a href={`mailto:${a.email}`}>{a.email}</a></TableCell>
            <TableCell>{a.district}</TableCell>
            <TableCell>{a.predictedParticipants}</TableCell>
            <TableCell>{booking ? booking.participants.length : ""}</TableCell>
            <TableCell>{applicationSheetsNumbers.isSuccess ? applicationSheetsNumbers.data[a.userId] === 0 ? "" : applicationSheetsNumbers.data[a.userId]  : "Loading"}</TableCell>
        </TableRow>
    })

    return <Grid xs={12} p={1} item>
        <Typography variant="h6">Pending</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Group/District</strong></TableCell>
                        <TableCell><strong>Predicted</strong></TableCell>
                        <TableCell><strong>Created</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {applicationRows}
                </TableBody>
            </Table>
        </TableContainer>
        <Typography variant="h6" sx={{mt:2}}>Approved</Typography>
        <Typography variant="subtitle1" sx={{mt:2}}>Total Predicted: {total}</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Group/District</strong></TableCell>
                        <TableCell><strong>Predicted</strong></TableCell>
                        <TableCell><strong>Booked</strong></TableCell>
                        <TableCell><strong>In Sheet</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {approvedApplicationRoles}
                </TableBody>
            </Table>
        </TableContainer>
    </Grid>
}