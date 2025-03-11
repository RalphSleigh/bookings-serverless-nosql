import React, { useCallback, useContext, useEffect, useState } from "react";
import { eventTimelineQuery, useDeleteBooking, useEditBooking } from "../queries.js";
import { BookingForm } from "./form/form.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";
import { PartialDeep } from "type-fest";

export function EditOwnBookingPage({ event, booking, user }) {
    const editBooking = useEditBooking(user, event)
    const deleteBooking = useDeleteBooking()
    const [bookingData, setBookingData] = useState<PartialDeep<JsonBookingType>>(booking)

    const submit = useCallback((notify) => {
        setBookingData(data => {
            data.extraContacts = data.extraContacts?.filter(c => c.name && c.email)
            console.log(data)
            editBooking.mutate({booking:data as JsonBookingType, notify: true})
            return data
        })
    }, [])

    const deleteBookingFn = useCallback(() => {
        deleteBooking.mutate({ eventId: bookingData.eventId!, userId: bookingData.userId! })
    }, [])

    return <BookingForm
        data={bookingData}
        originalData={booking}
        user={user}
        event={event}
        update={setBookingData}
        submit={submit}
        deleteBooking={deleteBookingFn}
        mode={bookingData.deleted ? "rebook" : "edit"}
        submitLoading={editBooking.isPending}
        deleteLoading={deleteBooking.isPending} />
}

