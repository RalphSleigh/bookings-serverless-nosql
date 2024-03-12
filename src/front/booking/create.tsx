import React, { useCallback, useContext, useState } from "react";
import { useCreateBooking, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonBookingType, JsonEventType, JsonUserResponseType, UserResponseType } from "../../lambda-common/onetable.js";
import { SnackBarContext, SnackbarDataType } from "../app/toasts.js";
import { PartialDeep } from "type-fest";

export function CreateBookingPage({ event, user }: { event: JsonEventType, user: JsonUserResponseType }) {
    const createBooking = useCreateBooking(event)
    const [bookingData, setBookingData] = useState<PartialDeep<JsonBookingType>>({ eventId: event.id, basic: { contactName: user!.userName, contactEmail: user?.email} })
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

