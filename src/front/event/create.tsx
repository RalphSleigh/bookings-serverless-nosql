import React from "react";
import { EventForm } from "./eventForm.js";
import { useMutation } from "@tanstack/react-query";
import { post_api } from "../queries.js";
import { Navigate } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { IsGlobalAdmin } from "../../shared/permissions.js";

export function CreateEventPage({ }) {

    const createEvent = useMutation({
        mutationFn: data =>
            post_api('event/create', { event: data })
    })

    if (createEvent.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = data => {
        console.log(data)
        createEvent.mutate(data)
    }

    return <EnsureHasPermission permission={IsGlobalAdmin}>
        <EventForm data={{}} submit={submit} mode={"create"} />
    </EnsureHasPermission>
}

