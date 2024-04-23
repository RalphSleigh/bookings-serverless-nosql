import React, { useContext } from "react";
import { useCreateBooking, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { CreateBookingPage } from "./create.js";

export function CreateBookingLoader({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const  { data: eventsData } = useEvents()

    const event = eventsData.events.find(e => e.id === eventId)


    if (!event) return <Navigate to='/' />

    const application = user.applications.find(a => a.eventId === event.id)

    return <EnsureHasPermission permission={CanBookIntoEvent} event={event} user={user}>
        <CreateBookingPage event={event} user={user} application={application} />
    </EnsureHasPermission>
}

