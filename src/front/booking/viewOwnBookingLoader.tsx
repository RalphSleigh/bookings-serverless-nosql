import React, { useContext } from "react";
import { useEvents, useUsersBookings } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanViewOwnBooking } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { ViewOwnBookingPage } from "./viewOwnBooking.js";

export function ViewOwnBookingLoader({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const { events  } = useEvents().data
    const { bookings } = useUsersBookings().data

    const event = events.find(e => e.id === eventId)
    if (!event) return <Navigate to='/' />

    const booking = bookings.find(b => b.eventId === event.id)
    if (!booking) return <Navigate to='/' />

    return <EnsureHasPermission permission={CanViewOwnBooking} event={event} user={user} booking={booking}>
        <ViewOwnBookingPage event={event} booking={booking} user={user} />
    </EnsureHasPermission>
}

