import React from "react";
import { Outlet, useOutletContext, useResolvedPath, useLocation } from "react-router-dom";
import { manageContext } from "./manageLoader.js";
import { Button, ButtonGroup, Grid, Link, Tab, Tabs, TextField } from "@mui/material";

export function Component() {
    const { event, bookings, timeline} = useOutletContext<manageContext>()

    const location = useLocation()

    const participantPath = useResolvedPath('participants')
    const bookingsPath = useResolvedPath('bookings')
    const rolesPath = useResolvedPath('roles')

    return <Grid container spacing={0}>
        <Grid xs={12} item>
            <Tabs value={!location.pathname.endsWith("manage") ? location.pathname : participantPath.pathname}>
                <Tab label="Participants" value={participantPath.pathname} href={participantPath.pathname} component={Link} />
                <Tab label="Bookings" value={bookingsPath.pathname} href={bookingsPath.pathname} component={Link} />
                <Tab label="Roles" value={rolesPath.pathname} href={rolesPath.pathname} component={Link} />
            </Tabs>
        </Grid>
        <Grid xs={12} p={2} item>
            <TextField sx={{ mr: 1, mt:1 }} size="small" margin="dense" label="Participant search" />
            <TextField sx={{ mr: 1, mt:1 }} size="small" margin="dense" label="Booking search" />
            <ButtonGroup variant="outlined" sx={{ mr: 1, mt:1 }} aria-label="outlined button group">
                <Button disabled={timeline.backEnabled} onClick={timeline.backFn}>{'<'}</Button>
                <Button>{timeline.position.time}</Button>
                <Button disabled={timeline.forwardEnabled} onClick={timeline.forwardFn}>{'>'}</Button>
                <Button disabled={timeline.forwardEnabled} onClick={timeline.toLatest}>{'>>'}</Button>
            </ButtonGroup>
        </Grid>
        <Grid xs={12} p={2} item>
            <Outlet context={{ event, bookings, timeline }} />
        </Grid>
    </Grid >
}