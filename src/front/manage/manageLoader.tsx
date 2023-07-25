import React, { useContext } from "react";
import { useCreateBooking, eventBookingsQuery, eventTimelineQuery, useEvents, eventBookingsQueryType, eventTimelineQueryType, useHistoricalEventBookings } from "../queries.js";
import { Navigate, Outlet, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent, CanManageEvent } from "../../shared/permissions.js";
import { UserContext } from "../user/userContext.js";
import { Jsonify } from 'type-fest'
import { BookingType, EventBookingTimelineType, EventType } from "../../lambda-common/onetable.js";
import { UseQueryOptions, useQueries } from "@tanstack/react-query";

export function Component({ }) {
    const user = useContext(UserContext)
    const { eventId } = useParams()
    const  { data: eventsData } = useEvents()
    const event = eventsData.events.find(e => e.id === eventId)
    if (!event) return <Navigate to='/' />

    const [bookingData, timelineData ] = useQueries<[eventBookingsQueryType, eventTimelineQueryType]>({queries: [eventBookingsQuery(eventId), eventTimelineQuery(eventId)]})
    const bookings = bookingData.data?.bookings
    const timeline = useTimeline(timelineData.data?.timeline.events)

    //Simple case, give all the latest data
    if(timeline.latest) return <EnsureHasPermission permission={CanManageEvent} event={event}>
            <Outlet context={{event, bookings, timeline}}/>
        </EnsureHasPermission>
     
    //ok, we need the historical data

    return <TimeLineDataLoader event={event} timeline={timeline}/>
}

export type manageContext = 
    {event: Jsonify<EventType>, 
    bookings: [Jsonify<BookingType>], 
    timeline: ReturnType<typeof useTimeline>,
    timelineLocation: string,
    setSearchParams: ReturnType<typeof useSearchParams>[1]}

function TimeLineDataLoader({event, timeline}){
    const  { data: horisticalData } = useHistoricalEventBookings(event.id, Date.parse(timeline.position.time).toString())
    return <EnsureHasPermission permission={CanManageEvent} event={event}>
            <Outlet context={{event, bookings: horisticalData.bookings, timeline}}/>
        </EnsureHasPermission>
}

function useTimeline(timelineData) {

    const timestamps = timelineData.map((d, i) => {return {position: i, ...d }})
    timestamps.push({position: timelineData.length, time: "Latest"})

    const [searchParams, setSearchParams] = useSearchParams();

    const value = searchParams.get("viewDate") ? parseInt(searchParams.get("viewDate")!) : timelineData.length
    const latest = value === timelineData.length
    return {
        latest: latest,
        position: timestamps[value],
        backEnabled: value <= 0,
        forwardEnabled: value >= timelineData.length,
        backFn: () => setSearchParams({viewDate: (value - 1).toString()}),
        forwardFn: () => setSearchParams({viewDate: (value + 1).toString()}),
        toLatest: () => setSearchParams({viewDate: timelineData.length.toString()})
    }
}