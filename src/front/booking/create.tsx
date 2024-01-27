import React, { useCallback, useContext, useState } from "react";
import { useCreateBooking, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";
import { SnackBarContext, SnackbarDataType } from "../app/toasts.js";

export function CreateBookingPage({ event, user }) {
    const createBooking = useCreateBooking(event)
    const [bookingData, setBookingData] = useState<Partial<JsonBookingType>>({ eventId: event.id })
    const setSnackbar = useContext(SnackBarContext)

    const submit = useCallback(() => {
        setBookingData(data => {
            console.log(data)
            createBooking.mutate(data as JsonBookingType)
            return data
        })
    }, [])

    return <BookingForm 
    data={bookingData} 
    user={user} 
    event={event} 
    update={setBookingData} 
    submit={submit} 
    mode={"create"} 
    deleteBooking={() => {}}
    submitLoading={createBooking.isPending}
    deleteLoading={false}/>
}

