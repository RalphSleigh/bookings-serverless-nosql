import React, { useState } from "react";
import { useCreateBooking, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";

export function CreateBookingPage({event, user}) {
    const createBooking = useCreateBooking()
    const [bookingData, setBookingData] = useState<Partial<JsonBookingType>>({eventId: event.id})

    if (createBooking.isSuccess) {
        return <Navigate to='/' />
    }

    const submit = () => {
        console.log(bookingData)
        createBooking.mutate(bookingData as JsonBookingType)
    }

    return <BookingForm data={bookingData} user={user} event={event} update={setBookingData} submit={submit} mode={"create"} />
}

