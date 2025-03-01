import React from "react";
import { BookingForm } from "./form/form.js";


export function ViewOwnBookingPage({ event, booking, user }) {
    return <BookingForm
        data={booking}
        originalData={booking}
        user={user}
        event={event}
        update={() => {}}
        submit={() => {}}
        deleteBooking={() => {}}
        mode={"view"}
        submitLoading={false}
        deleteLoading={false} />
}

