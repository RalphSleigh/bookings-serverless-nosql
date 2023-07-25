import React from "react";
import { EventForm } from "./eventForm.js";
import { useEditEvent, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanEditEvent } from "../../shared/permissions.js";

export function EditEventLoader({}) {
    const { eventId } = useParams()
    const  { data: eventsData } = useEvents()
    const editEvent = useEditEvent()

    const event = eventsData.events.find(e => e.id === eventId)

    if(!event) return <Navigate to='/' />

    if (editEvent.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = data => {
        console.log(data)
        editEvent.mutate(data)
    }
    
    return  <EnsureHasPermission permission={CanEditEvent} event={event}>
                <EventForm data={event} submit={submit}  mode={"edit"}/>
            </EnsureHasPermission> 
}

