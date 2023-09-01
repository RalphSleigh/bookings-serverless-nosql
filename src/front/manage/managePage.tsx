import React, { useContext } from "react";
import { Outlet, useOutletContext, useResolvedPath, useLocation } from "react-router-dom";
import { manageLoaderContext } from "./manageLoader.js";
import { Button, ButtonGroup, FormControlLabel, Grid, Link, Switch, Tab, Tabs, TextField } from "@mui/material";
import { useDisableDriveSync, useEventBookings, useHistoricalEventBookings } from "../queries.js";
import { JsonBookingType, JsonEventType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { SuspenseWrapper } from "../suspense.js";
import { UserContext } from "../user/userContext.js";
import { CanManageWholeEvent } from "../../shared/permissions.js";

export function Component() {
    const { event, timeline } = useOutletContext<manageLoaderContext>()
    const user = useContext(UserContext)!

    const location = useLocation()

    const participantPath = useResolvedPath('participants')
    const bookingsPath = useResolvedPath('bookings')
    const rolesPath = useResolvedPath('roles')

    const Loader = timeline.latest ? LatestDataLoader : TimeLineDataLoader

    return <Grid container spacing={0}>
        <Grid xs={12} item>
            <Tabs value={!location.pathname.endsWith("manage") ? location.pathname : participantPath.pathname}>
                <Tab label="Participants" value={participantPath.pathname} href={participantPath.pathname} component={Link} />
                <Tab label="Bookings" value={bookingsPath.pathname} href={bookingsPath.pathname} component={Link} />
                <PermissionTab user={user} event={event} permission={CanManageWholeEvent} label="Roles" value={rolesPath.pathname} href={rolesPath.pathname} component={Link} />
            </Tabs>
        </Grid>
        {shouldShowSearch(location) ? <Grid xs={12} p={2} item>
            <SyncWidget user={user} />
            <TextField sx={{ mr: 1, mt: 1 }} size="small" margin="dense" label="Participant search" />
            <TextField sx={{ mr: 1, mt: 1 }} size="small" margin="dense" label="Booking search" />
            <ButtonGroup variant="outlined" sx={{ mr: 1, mt: 1 }} aria-label="outlined button group">
                <Button disabled={timeline.backEnabled} onClick={timeline.backFn}>{'<'}</Button>
                <Button>{timeline.position.time}</Button>
                <Button disabled={timeline.forwardEnabled} onClick={timeline.forwardFn}>{'>'}</Button>
                <Button disabled={timeline.forwardEnabled} onClick={timeline.toLatest}>{'>>'}</Button>
            </ButtonGroup>

        </Grid> : null}

            <SuspenseWrapper>
                <Loader event={event} timeline={timeline} />
            </SuspenseWrapper>
    </Grid >
}

function shouldShowSearch(location) {
    return location.pathname.endsWith("manage") || location.pathname.endsWith("participants") || location.pathname.endsWith("bookings")
}

export type managePageContext = manageLoaderContext & {
    bookings: Array<JsonBookingType>
}

function LatestDataLoader({ event, timeline }) {
    const { bookings } = useEventBookings(event.id).data
    return <Outlet context={{ event, bookings, timeline }} />
}

function TimeLineDataLoader({ event, timeline }) {
    const { bookings } = useHistoricalEventBookings(event.id, Date.parse(timeline.position.time).toString()).data
    return <Outlet context={{ event, bookings, timeline }} />
}

const  PermissionTab: React.FC<any> = props => {
    const { user, event, permission, ...rest } = props 
    if(permission.if({user, event})) return <Tab {...rest} />
    else return null
}

const SyncWidget: React.FC<{user: JsonUserResponseType}> = props => {

    const disableDriveSync = useDisableDriveSync()

    const {user} = props
    if(!user || user.source !== "google") return null

    const change = e => {
        if(user.tokens) {
            disableDriveSync.mutate("")
        } else {
            window.location.href = "/api/auth/google_drive/redirect"
        }
    }

    return <FormControlLabel sx={{ float: "right" }} control={<Switch checked={user.tokens} onChange={change}/>} label="Drive Sync" />
}