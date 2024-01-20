import React, { useCallback, useState } from "react";
import { useDeleteBooking, useEditBooking } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";

export function EditOwnBookingPage({ event, booking, user }) {
    const editBooking = useEditBooking()
    const deleteBooking = useDeleteBooking()
    const [bookingData, setBookingData] = useState<Partial<JsonBookingType>>(booking)

    const submit = useCallback(() => {
        setBookingData(data => {
            console.log(data)
            editBooking.mutate(data as JsonBookingType)
            return data
        })
    }, [])

    const deleteBookingFn = useCallback(() => {
        deleteBooking.mutate({eventId: bookingData.eventId!, userId: bookingData.userId!})
    }, [])

    if (deleteBooking.isSuccess) {
        return <Navigate to={`/`} />
    }

    if (editBooking.isSuccess) {
        return <Navigate to={`/event/${event.id}/thanks`} />
    }

    return <BookingForm 
    data={bookingData} 
    user={user} 
    event={event} 
    update={setBookingData} 
    submit={submit} 
    deleteBooking={deleteBookingFn} 
    mode={bookingData.deleted ? "rebook" : "edit"}
    submitLoading={editBooking.isPending}
    deleteLoading={deleteBooking.isPending} />
}

