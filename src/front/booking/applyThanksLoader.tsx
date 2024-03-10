import React, { useContext } from "react";
import { useEvents, useUsersBookings } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanEditOwnBooking } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { ThanksPage } from "./thanks.js";
import { addComputedFieldsToBookingsQueryResult } from "../../shared/util.js";
import { ApplicationThanksPage } from "./applicationThanks.js";

export function ApplyThanksLoader({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const { events  } = useEvents().data

    const event = events.find(e => e.id === eventId)
    if (!event) return <Navigate to='/' />

    return <ApplicationThanksPage event={event} user={user} />

}
