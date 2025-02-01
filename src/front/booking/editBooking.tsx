import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDeleteBooking, useEditBooking } from "../queries.js";
import { Navigate } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { JsonBookingType } from "../../lambda-common/onetable.js";
import { SnackBarContext, SnackbarDataType } from "../app/toasts.js";
import { PartialDeep } from "type-fest";

export function EditBookingPage({ event, booking, user }) {
    const editBooking = useEditBooking(user, event)
    const deleteBooking = useDeleteBooking()
    const [bookingData, setBookingData] = useState<PartialDeep<JsonBookingType>>(booking)
    const setSnackbar = useContext(SnackBarContext)

    const submit = useCallback((notify) => {
        setBookingData(data => {
            data.extraContacts = data.extraContacts?.filter(c => c.name && c.email)
            console.log(data)
            editBooking.mutate({booking: data as JsonBookingType, notify: notify})
            return data
        })
    }, [])

    const deleteBookingFn = useCallback(() => {
        deleteBooking.mutate({ eventId: bookingData.eventId!, userId: bookingData.userId! })
    }, [])

    const setSnackBarFn = useCallback((data: SnackbarDataType) => { setSnackbar(data) }, [])

    if (deleteBooking.isSuccess) {
        setSnackBarFn({ message: `Booking Cancelled`, severity: 'success' })
        return <Navigate to={`/`} />
    }

    if (editBooking.isSuccess) {
        setSnackBarFn({ message: `Booking Edited`, severity: 'success' })
        return <Navigate to={`/`} />
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

