import React, { useContext } from "react";
import { useEventBookings, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanEditBooking } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { EditOwnBookingPage } from "./editOwnBooking.js";
import { EditBookingPage } from "./editBooking.js";

export function EditBookingLoader({ }) {
    const user = useContext(UserContext)
    const { eventId, userId } = useParams()
    const { events  } = useEvents().data

    const event = events.find(e => e.id === eventId)
    if (!event) return <Navigate to='/' />

    const { bookings } = useEventBookings(event.id).data
    const booking = bookings.find(b => b.userId === userId)
    if (!booking) return <Navigate to='/' />

    return <EnsureHasPermission permission={CanEditBooking} event={event} user={user} booking={booking}>
        <EditBookingPage event={event} booking={booking} user={user} />
    </EnsureHasPermission>
}

