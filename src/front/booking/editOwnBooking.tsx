import React, { useCallback, useState } from "react";
import { useEditBooking } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";

export function EditOwnBookingPage({event, booking, user}) {
    const editBooking = useEditBooking()
    const [bookingData, setBookingData] = useState<Partial<JsonBookingType>>(booking)

    if (editBooking.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = useCallback(() => {
        console.log(bookingData)
        editBooking.mutate(bookingData as JsonBookingType)
    }, [])

    return <BookingForm data={bookingData} user={user} event={event} update={setBookingData} submit={submit} mode={"edit"} />
}

