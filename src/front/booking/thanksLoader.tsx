import React, { useContext } from "react";
import { useEvents, useUsersBookings } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanEditOwnBooking } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { ThanksPage } from "./thanks.js";
import { addComputedFieldsToBookingsQueryResult } from "../../shared/util.js";

export function ThanksLoader({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const { events  } = useEvents().data
    const { bookings } = useUsersBookings().data

    const event = events.find(e => e.id === eventId)
    if (!event) return <Navigate to='/' />

    const booking = bookings.find(b => b.eventId === event.id)
    if (!booking) return <Navigate to='/' />

    const enhancedBooking = addComputedFieldsToBookingsQueryResult([booking], event)[0]

    return <EnsureHasPermission permission={CanEditOwnBooking} event={event} user={user} booking={enhancedBooking}>
        <ThanksPage event={event} booking={enhancedBooking} user={user} />
    </EnsureHasPermission>
}

