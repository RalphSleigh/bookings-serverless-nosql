import React, { useContext } from "react";
import { useCreateBooking, useEvents, useUsersBookings } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanEditOwnBooking } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { CreateBookingPage } from "./create.js";
import { EditOwnBookingPage } from "./editOwnBooking.js";

export function EditOwnBookingLoader({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const { events  } = useEvents().data
    const { bookings } = useUsersBookings().data

    const event = events.find(e => e.id === eventId)
    if (!event) return <Navigate to='/' />

    const booking = bookings.find(b => b.eventId === event.id)
    if (!booking) return <Navigate to='/' />

    return <EnsureHasPermission permission={CanEditOwnBooking} event={event} user={user} booking={booking}>
        <EditOwnBookingPage event={event} booking={booking} user={user} />
    </EnsureHasPermission>
}

