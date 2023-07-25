import React, { useState } from "react";
import { useCreateBooking, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType } from "../../lambda-common/onetable.js";

export function CreateBookingPage({event, user}) {
    const createBooking = useCreateBooking()
    const [bookingData, setBookingData] = useState<Partial<BookingType>>({eventId: event.id})

    if (createBooking.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = () => {
        console.log(bookingData)
        createBooking.mutate(bookingData as BookingType)
    }

    return <BookingForm data={bookingData} user={user} update={setBookingData} submit={submit} mode={"create"} />
}

