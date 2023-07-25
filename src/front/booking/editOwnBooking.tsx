import React, { useState } from "react";
import { useEditBooking } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType } from "../../lambda-common/onetable.js";

export function EditOwnBookingPage({event, booking, user}) {
    const editBooking = useEditBooking()
    const [bookingData, setBookingData] = useState<Partial<BookingType>>(booking)

    if (editBooking.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = () => {
        console.log(bookingData)
        editBooking.mutate(bookingData as BookingType)
    }

    return <BookingForm data={bookingData} user={user} update={setBookingData} submit={submit} mode={"edit"} />
}

