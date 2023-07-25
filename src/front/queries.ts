import { QueryObserverSuccessResult, UseQueryOptions, useMutation, useQueries, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Jsonify } from 'type-fest'
import { BookingType, EventBookingTimelineType, EventType } from '../lambda-common/onetable.js'

export async function get_api<Res>(url: string) {
    const { data } = await axios.get<Res>(`/api/${url}`)
    return data
}

export async function post_api<Res>(url: string, data: any): Promise<Res> {
    return axios.post(`/api/${url}`, data)
}

export function useEvents() {
    return useQuery(['events'],
        async () => (await axios.get("/api/events")).data) as QueryObserverSuccessResult<{ "events": [Jsonify<EventType>] }>
}

export function useUsersBookings() {
    return useQuery(['user', 'bookings'],
        async () => (await axios.get("/api/booking/user")).data) as QueryObserverSuccessResult<{ "bookings": [Jsonify<BookingType>] }>
}

export function useEditEvent() {
    return useMutation({
        mutationFn: data =>
            post_api('event/edit', { event: data })
    })
}

export function useCreateBooking() {
    return useMutation<{ booking: Jsonify<BookingType> }, any, BookingType, any>(
        async data => (await axios.post('/api/booking/create', { booking: data })).data
    )
}

export function useEditBooking() {
    return useMutation<{ booking: Jsonify<BookingType> }, any, BookingType, any>(
        async data => (await axios.post('/api/booking/edit', { booking: data })).data
    )
}

export const eventBookingsQuery = eventId => {
    return {
        queryKey: [eventId, 'bookings'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/bookings`)).data
    }
}

export type eventBookingsQueryType = UseQueryOptions<{ "bookings": [Jsonify<BookingType>] }, any>

/* export function useEventBookings(eventId) {
    return useQuery([eventId, 'bookings'],
        async () => (await axios.get(`/api/event/${eventId}/manage/bookings`)).data) as QueryObserverSuccessResult<{ "bookings": [Jsonify<BookingType>] }>
} */

export const eventTimelineQuery = eventId => {
    return {
        queryKey: [eventId, 'timeline'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/timeline`)).data
    }
}

export type eventTimelineQueryType = UseQueryOptions<{ "timeline": Jsonify<EventBookingTimelineType>}, any>
/* export function useEventTimeline(eventId) {
    return useQuery([eventId, 'bookings'],
        async () => (await axios.get(`/api/event/${eventId}/manage/timeline`)).data) as QueryObserverSuccessResult<{ "timeline": Jsonify<EventBookingTimelineType> }>
} */

export function useHistoricalEventBookings(eventId, timestamp) {
    return useQuery([eventId, 'bookings', timestamp],
        async () => (await axios.get(`/api/event/${eventId}/manage/bookings/${timestamp}`)).data) as QueryObserverSuccessResult<{ "bookings": [Jsonify<BookingType>] }>
}