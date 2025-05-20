import React, { useContext, useMemo, useState } from "react";
import { Outlet, useOutletContext, useResolvedPath, useLocation } from "react-router-dom";
import { manageLoaderContext } from "./manageLoader.js";
import { Box, Button, ButtonGroup, FormControl, FormControlLabel, Grid, InputLabel, Link, MenuItem, Modal, Paper, Select, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useDisableDriveSync, useEventBookings, useHistoricalEventBookings, useToggleEventEmail } from "../queries.js";
import { JsonBookingType, JsonEventType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { SuspenseWrapper } from "../suspense.js";
import { UserContext } from "../user/userContext.js";
import { CanCreateAnyRole, CanManageApplications, CanManageVillages, CanManageWholeEvent, CanSeeKPPage, CanSeeMoneyPage } from "../../shared/permissions.js";
import { bookingsBookingSearch, bookingsParticipantSearch, useDebounceState, useStickyState } from "../util.js";
import { JsonBookingWithExtraType } from "../../shared/computedDataTypes.js";
import { ReactErrorBoundary } from "../app/errors.js";
import { addComputedFieldsToBookingsQueryResult } from "../../shared/util.js";
import Markdown from 'react-markdown'
import { POLICY_MARKDPOWN } from "./policy.js"

export function Component() {
    const { event, timeline } = useOutletContext<manageLoaderContext>()
    const user = useContext(UserContext)!

    const location = useLocation()

    const toggleEventEmail = useToggleEventEmail()

    const participantPath = useResolvedPath('participants')
    const bookingsPath = useResolvedPath('bookings')
    const applicationsPath = useResolvedPath('applications')
    const kpPath = useResolvedPath('kp')
    const emailsPath = useResolvedPath('emails')
    const rolesPath = useResolvedPath('roles')
    const moneyPath = useResolvedPath('money')
    const villagesPath = useResolvedPath('villages')
    const birthdaysPath = useResolvedPath('birthdays')
    const graphsPath = useResolvedPath('graphs')

    const [acceptedPolicy, setAcceptedPolicy] = useStickyState<boolean>(false, "acceptedPolicy20240703")

    const [displayAdvanced, setDisplayAdvanced] = React.useState<boolean>(false)
    const [displayDeleted, setDisplayDeleted] = React.useState<boolean>(false)
    const [participantSearch, debouncedParticipantSearch, setParticipantSearch] = useDebounceState<string>("", 500)
    const [bookingSearch, debouncedBookingSearch, setBookingSearch] = useDebounceState<string>("", 500)
    const [villageSearch, setVillageSearch] = useState<string>("All")
    const [townSearch, setTownSearch] = useState<string>("All")

    const updateParticipantSearch = e => {
        setParticipantSearch(e.target.value)
    }

    const updateBookingSearch = e => {
        setBookingSearch(e.target.value)
    }

    const updateVillageSearch = e => {
        setVillageSearch(e.target.value)
    }

    const updateTownSearch = e => {
        setTownSearch(e.target.value)
    }

    const emailEnabled = !(user.eventEmailNopeList && user.eventEmailNopeList.includes(event.id))
    const emailChange = () => {
        toggleEventEmail.mutate({ eventId: event.id, state: !emailEnabled })
    }

    const Loader = timeline.latest ? MemoLatestDataLoader : MemoTimeLineDataLoader

    const villagesOptions = event.villages?.filter(v => v.town === townSearch || townSearch === "All").map((v, i) => {
        return <MenuItem key={i} value={v.name}>{v.name}</MenuItem>
    })

    const towns = new Set<string>()
    event.villages?.forEach(v => towns.add(v.town))
    const townsOptions = Array.from(towns).map((t: string, i: number) => {
        return <MenuItem key={i} value={t}>{t}</MenuItem>
    })

    return <>

        <Grid container spacing={0}>
            <UsagePolicyModal accepted={acceptedPolicy} handleClose={() => setAcceptedPolicy(true)} />
            <Grid xs={12} item>
                <Tabs value={!location.pathname.endsWith("manage") ? location.pathname : participantPath.pathname} variant="scrollable" scrollButtons="auto">
                    <Tab label="Participants" value={participantPath.pathname} href={participantPath.pathname} component={Link} />
                    <Tab label="Bookings" value={bookingsPath.pathname} href={bookingsPath.pathname} component={Link} />
                    {event.applicationsRequired ? <PermissionTab user={user} event={event} permission={CanManageApplications} label="Applications" value={applicationsPath.pathname} href={applicationsPath.pathname} component={Link} /> : null}
                    <PermissionTab user={user} event={event} permission={CanSeeKPPage} label="KP" value={kpPath.pathname} href={kpPath.pathname} component={Link} />
                    <Tab label="Emails" value={emailsPath.pathname} href={emailsPath.pathname} component={Link} />
                    <PermissionTab user={user} event={event} permission={CanCreateAnyRole} label="Roles" value={rolesPath.pathname} href={rolesPath.pathname} component={Link} />
                    <PermissionTab user={user} event={event} permission={CanSeeMoneyPage} label="Money" value={moneyPath.pathname} href={moneyPath.pathname} component={Link} />
                    <PermissionTab user={user} event={event} permission={CanManageWholeEvent} label="Villages" value={villagesPath.pathname} href={villagesPath.pathname} component={Link} />
                    <Tab label="🎂" value={birthdaysPath.pathname} href={birthdaysPath.pathname} component={Link} />
                    <Tab label="📈" value={graphsPath.pathname} href={graphsPath.pathname} component={Link} />
                </Tabs>
            </Grid>
        </Grid>
        <Grid container spacing={2} p={2}>
            {shouldShowSearch(location) ? <><Grid xs={12} item sx={{ displayPrint: "none" }}>
                <FormControlLabel sx={{ float: "right" }} control={<Switch checked={displayAdvanced} onChange={() => setDisplayAdvanced(!displayAdvanced)} />} label="Advanced" />
                <TextField autoComplete="off" sx={{ mr: 1, mt: 1 }} size="small" margin="dense" label="Participant search" value={participantSearch} onChange={updateParticipantSearch} />
                <TextField autoComplete="off" sx={{ mr: 1, mt: 1 }} size="small" margin="dense" label="Booking search" value={bookingSearch} onChange={updateBookingSearch} />
                {event.bigCampMode ? <>
                    <FormControl sx={{ mr: 1, mt: 1, minWidth: 120 }} size="small">
                        <InputLabel id="towns">Town</InputLabel>
                        <Select label="Town" labelId="towns" onChange={updateTownSearch} value={townSearch}>
                            <MenuItem value="All">All</MenuItem>
                            {townsOptions}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ mr: 1, mt: 1, minWidth: 120 }} size="small">
                        <InputLabel id="villages">Village</InputLabel>
                        <Select label="Village" labelId="villages" onChange={updateVillageSearch} value={villageSearch}>
                            <MenuItem value="All">All</MenuItem>
                            {villagesOptions}
                        </Select>
                    </FormControl>
                </> : null}
            </Grid>
                {displayAdvanced ? <Grid xs={12} item sx={{ displayPrint: "none" }}>
                    <FormControlLabel sx={{ float: "right" }} control={<Switch checked={emailEnabled} onChange={() => emailChange()} />} label="Email me notifications" />
                    <FormControlLabel sx={{ float: "right" }} control={<Switch checked={displayDeleted} onChange={() => setDisplayDeleted(!displayDeleted)} />} label="Show Cancelled" />
                    <SyncWidget user={user} />
                    <ButtonGroup variant="outlined" sx={{ mr: 1 }} aria-label="outlined button group">
                        <Button disabled={timeline.backEnabled} onClick={timeline.backFn}>{'<'}</Button>
                        <Button>{timeline.position.time}</Button>
                        <Button disabled={timeline.forwardEnabled} onClick={timeline.forwardFn}>{'>'}</Button>
                        <Button disabled={timeline.forwardEnabled} onClick={timeline.toLatest}>{'>>'}</Button>
                    </ButtonGroup>
                </Grid> : null}</> : null}

            <SuspenseWrapper>
                <Loader event={event} 
                timeline={timeline} 
                displayDeleted={displayDeleted} 
                participantSearch={debouncedParticipantSearch} 
                bookingSearch={debouncedBookingSearch} 
                villageSearch={villageSearch}
                townSearch={townSearch}
                location={location}
                />
            </SuspenseWrapper>
        </Grid ></>
}

function shouldShowSearch(location) {
    return location.pathname.endsWith("manage") 
    || location.pathname.endsWith("participants") 
    || location.pathname.endsWith("bookings") 
    || location.pathname.endsWith("kp") 
    || location.pathname.endsWith("emails") 
    || location.pathname.endsWith("birthdays")
    || location.pathname.endsWith("money")
}

function shouldIgnoreSearch(location) {
    return location.pathname.endsWith("villages") 
}

export type managePageContext = manageLoaderContext & {
    bookings: Array<JsonBookingWithExtraType>
    displayDeleted: boolean
}

function LatestDataLoader({ event, timeline, displayDeleted, participantSearch, bookingSearch, villageSearch, townSearch, location }) {
    const mode = location.pathname.endsWith("money") || location.pathname.endsWith("bookings") ? "find" : "filter"
    const { bookings } = useEventBookings(event.id).data
    const enhancedBookings = addComputedFieldsToBookingsQueryResult(bookings, event)
    if(shouldIgnoreSearch(location)) return <Outlet context={{ event, bookings, timeline, displayDeleted }} />
    const bookingSearchedBookings = bookingsBookingSearch(event, enhancedBookings, bookingSearch, villageSearch, townSearch)
    const searchedBookings = bookingsParticipantSearch(bookingSearchedBookings, participantSearch, mode)
    return <Outlet context={{ event, bookings: searchedBookings, timeline, displayDeleted }} />
}

const MemoLatestDataLoader = React.memo(LatestDataLoader)

function TimeLineDataLoader({ event, timeline, displayDeleted, participantSearch, bookingSearch, villageSearch, townSearch, location }) {
    const mode = location.pathname.endsWith("money") || location.pathname.endsWith("bookings") ? "find" : "filter"
    const { bookings } = useHistoricalEventBookings(event.id, Date.parse(timeline.position.time).toString()).data
    const enhancedBookings = addComputedFieldsToBookingsQueryResult(bookings, event)
    if(shouldIgnoreSearch(location)) return <Outlet context={{ event, bookings, timeline, displayDeleted }} />
    const bookingSearchedBookings = bookingsBookingSearch(event, enhancedBookings, bookingSearch, villageSearch, townSearch)
    const searchedBookings = bookingsParticipantSearch(bookingSearchedBookings, participantSearch, mode)
    return <Outlet context={{ event, bookings: searchedBookings, timeline, displayDeleted }} />
}

const MemoTimeLineDataLoader = React.memo(TimeLineDataLoader)

const PermissionTab: React.FC<any> = props => {
    const { user, event, permission, ...rest } = props
    if (permission.if({ user, event })) return <Tab {...rest} />
    else return null
}

const SyncWidget: React.FC<{ user: JsonUserResponseType }> = props => {

    const disableDriveSync = useDisableDriveSync()

    const { user } = props
    if (!user || user.source !== "google") return null

    const change = e => {
        if (user.tokens) {
            disableDriveSync.mutate("")
        } else {
            window.location.href = "/api/auth/google_drive/redirect"
        }
    }

    return <FormControlLabel sx={{ float: "right" }} control={<Switch checked={user.tokens} onChange={change} />} label="Drive Sync" />
}

const UsagePolicyModal = ({ accepted, handleClose }: { accepted: boolean, handleClose: () => void }) => {
    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        p: 2,
        outline: 'none',
        width: 'calc(100vw - 20px)',
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: 'calc(100vh - 20px)',
        display: 'flex',
        flexDirection: 'column',
        alighItems: 'start',
    }

    if (accepted) return null

    return (<Modal
        open={!accepted}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description">
        <Paper elevation={6} sx={style}>
            <Box sx={{ flexGrow: 1, overflow: 'scroll' }}><Markdown>{POLICY_MARKDPOWN}</Markdown>
            </Box>
            <Button variant="contained" onClick={handleClose}>Accept</Button>
        </Paper>
    </Modal>)
}