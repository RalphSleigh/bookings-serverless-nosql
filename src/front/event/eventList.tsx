import { Button, Fab, Link, Paper, Typography } from "@mui/material";
import { Unstable_Grid2 as Grid } from '@mui/material';
import React, { useContext } from "react";
import { Add } from '@mui/icons-material';
import { BookingType, EventType, JsonBookingType, JsonEventType } from "../../lambda-common/onetable.js";
import { useEvents, useUsersBookings } from "../queries.js";
import { isSameMonth, format, parseISO } from "date-fns";
import { CanEditEvent, CanEditOwnBooking, CanManageEvent, IsGlobalAdmin } from "../../shared/permissions.js";
import { IfHasPermission } from "../permissions.js";
import { parseDate, toLocalDate } from "../util.js";
import { UserContext } from "../user/userContext.js";
import { Link as RouterLink } from 'react-router-dom'


export function EventList(props) {
    const { events } = useEvents().data
    const { bookings } = useUsersBookings().data

    const cards = events.sort((a, b) => (a.startDate < b.startDate) ? -1 : ((a.startDate > b.startDate) ? 1 : 0)).map(e => <EventCard event={e} key={e.id} booking={bookings.find(b => b.eventId === e.id)} />)

    const fabStyle = {
        position: 'absolute',
        bottom: 16,
        right: 16,
    };

    return <>
        <Grid container spacing={0}>
            <Grid xs={12} p={2}>
                {cards}
            </Grid>
        </Grid>
        <IfHasPermission permission={IsGlobalAdmin}>
            <Fab sx={fabStyle} size="small" color="secondary" aria-label="add" href="/event/create">
                <Add />
            </Fab>
        </IfHasPermission>
    </>
}

function EventCard({ event, booking }: { event: JsonEventType, booking?: JsonBookingType }) {

    const startDate = toLocalDate(event.startDate)!
    const endDate = toLocalDate(event.endDate)!

    const startDataFormat = isSameMonth(startDate, endDate) ? 'do' : 'do MMMM'

    return <Paper sx={{ mt: 2, p: 2 }} elevation={6}>
        <BookingButton event={event} booking={booking} />
        <Typography variant="h5">{event.name}</Typography>
        <Typography sx={{ mt: 1 }} variant="body1">{format(startDate, startDataFormat)} - {format(endDate, 'do MMMM')}</Typography>
        {booking ? <Typography sx={{ mt: 1 }} variant="body1">Your booking</Typography> : null}
        <Typography align='right'>
            <IfHasPermission permission={CanEditEvent} event={event}>
                <Link href={`/event/${event.id}/edit`}>Edit</Link>
            </IfHasPermission>{' '}
            <IfHasPermission permission={CanManageEvent} event={event}>
                <Link href={`/event/${event.id}/manage`}>Manage</Link>
            </IfHasPermission>
        </Typography>

    </Paper>
}

function BookingButton({ event, booking }: { event: JsonEventType, booking?: JsonBookingType }) {
    const user = useContext(UserContext)
    if (!user) return <Button variant="contained" sx={{ float: "right" }} component={RouterLink} to="/login">Log in to Book</Button>

    if (Date.now() > parseDate(event.bookingDeadline)!.getTime()) return <Button variant="contained" sx={{ float: "right" }} disabled>Deadline Passed</Button>

    if (booking && CanEditOwnBooking.if({ user, event, booking })) return <Button variant="contained" sx={{ float: "right" }} component={RouterLink} to={`/event/${event.id}/edit-my-booking`}>Edit my booking
    </Button>

    return <Button variant="contained" sx={{ float: "right" }} component={RouterLink} to={`/event/${event.id}/book`}>Book
    </Button>
}