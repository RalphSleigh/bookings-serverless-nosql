import React, { useContext } from "react";
import { useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanApplyToEvent } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { CreateApplicationPage } from "./apply.js";

export function ApplyLoader({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const  { data: eventsData } = useEvents()

    const event = eventsData.events.find(e => e.id === eventId)

    if (!event) return <Navigate to='/' />

    return <EnsureHasPermission permission={CanApplyToEvent} event={event} user={user}>
        <CreateApplicationPage event={event} user={user} />
    </EnsureHasPermission>
}

