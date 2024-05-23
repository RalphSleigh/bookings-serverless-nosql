import React, { useCallback, useContext, useState } from "react";
import { useCreateBooking, useEvents, useUsersBookings } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonApplicationType, JsonBookingType, JsonEventType, JsonUserResponseType, UserResponseType } from "../../lambda-common/onetable.js";
import { SnackBarContext, SnackbarDataType } from "../app/toasts.js";
import { PartialDeep } from "type-fest";

export function CreateBookingPage({ event, user, application }: { event: JsonEventType, user: JsonUserResponseType, application: JsonApplicationType | undefined }) {
    const createBooking = useCreateBooking(event)
    const { bookings } = useUsersBookings().data
    let existingBooking: PartialDeep<JsonBookingType, {recurseIntoArrays: true}> | undefined = undefined

    if(event.kpMode === "basic" && event.attendanceStructure === "whole") {
        existingBooking = bookings.sort((a, b) => a.participants.length - b.participants.length).pop()
        if(existingBooking) {
            existingBooking.eventId = event.id
            delete existingBooking.created
            delete existingBooking.updated
            existingBooking.participants?.forEach(p => {
                delete p?.created
                delete p?.updated
            })
        }
    }

    const emptyBooking: PartialDeep<JsonBookingType> = { eventId: event.id, userId: user.id, basic: { contactName: user!.userName, contactEmail: user?.email, bookingType: application?.bookingType, district: application?.district }}
    
    const [bookingData, setBookingData] = useState<PartialDeep<JsonBookingType>>(existingBooking ?? emptyBooking)
    const setSnackbar = useContext(SnackBarContext)

    const submit = useCallback(() => {
        setBookingData(data => {
            data.extraContacts = data.extraContacts?.filter(c => c.name && c.email)
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
        deleteBooking={() => { }}
        submitLoading={createBooking.isPending}
        deleteLoading={false} />
}

