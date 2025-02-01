import React, { useCallback, useContext, useEffect, useState } from "react";
import { eventTimelineQuery, useDeleteBooking, useEditBooking } from "../queries.js";
import { BookingForm } from "./form/form.js";
import { BookingType, JsonBookingType } from "../../lambda-common/onetable.js";
import { PartialDeep } from "type-fest";

export function ViewOwnBookingPage({ event, booking, user }) {
    return <BookingForm
        data={booking}
        user={user}
        event={event}
        update={() => {}}
        submit={() => {}}
        deleteBooking={() => {}}
        mode={"view"}
        submitLoading={false}
        deleteLoading={false} />
}

