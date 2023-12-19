import React from "react";
import { EventForm } from "./eventForm.js";
import { useCreateEvent } from "../queries.js";
import { Navigate } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { IsGlobalAdmin } from "../../shared/permissions.js";

export function CreateEventPage({ }) {

    const createEvent = useCreateEvent()

    if (createEvent.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = data => {
        console.log(data)
        createEvent.mutate(data)
    }

    return <EnsureHasPermission permission={IsGlobalAdmin}>
        <EventForm data={{feeData: {}}} submit={submit} mode={"create"} />
    </EnsureHasPermission>
}

