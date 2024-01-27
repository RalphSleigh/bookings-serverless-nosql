import React, { useCallback, useContext, useEffect, useState } from "react";
import { eventTimelineQuery, useDeleteBooking, useEditBooking } from "../queries.js";
import { BookingForm } from "./form/form.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";

export function EditOwnBookingPage({ event, booking, user }) {
    const editBooking = useEditBooking(user, event)
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
        deleteBooking.mutate({ eventId: bookingData.eventId!, userId: bookingData.userId! })
    }, [])

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

