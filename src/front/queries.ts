import { QueryObserverSuccessResult, UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Jsonify } from 'type-fest'
import { BookingType, EventBookingTimelineType, EventType } from '../lambda-common/onetable.js'
import { UserContextType } from './user/userContext.js'

export function useEnv() {
    return useQuery(['env'],
        async () => (await axios.get("/api/env")).data) as QueryObserverSuccessResult<{ "env": string }>
}

export const userQuery = {
    queryKey: ['user'],
    queryFn: async () => (await axios.get("/api/user")).data
}

export function useUser() {
    return useQuery(userQuery.queryKey, userQuery.queryFn) as QueryObserverSuccessResult<{ "user": UserContextType }>
}

export const eventsQuery = {
    queryKey: ['events'],
    queryFn: async () => (await axios.get("/api/events")).data
}

export function useEvents() {
    return useQuery(eventsQuery.queryKey, eventsQuery.queryFn) as QueryObserverSuccessResult<{ "events": [Jsonify<EventType>] }>
}

export const userBookingsQuery = {
    queryKey: ['user', 'bookings'],
    queryFn: async () => (await axios.get("/api/booking/user")).data
}

export function useCreateEvent() {
    const queryClient = useQueryClient()
    return useMutation(
        async data => (await axios.post('/api/event/create', { event: data })),
        {  
            onSuccess: () => { 
                queryClient.invalidateQueries(['events'])
        }})
}

export function useUsersBookings() {
    return useQuery(userBookingsQuery.queryKey, userBookingsQuery.queryFn) as QueryObserverSuccessResult<{ "bookings": [Jsonify<BookingType>] }>
}

export function useEditEvent() {
    const queryClient = useQueryClient()
    return useMutation(
        async data => (await axios.post('/api/event/edit', { event: data })),
        {  
            onSuccess: () => { 
                queryClient.invalidateQueries(['events'])
        }})
}

export function useCreateBooking() {
    const queryClient = useQueryClient()
    return useMutation<{ booking: Jsonify<BookingType> }, any, BookingType, any>(
        async data => (await axios.post('/api/booking/create', { booking: data })).data,
        {  
            onSuccess: () => { 
                queryClient.invalidateQueries(['user', 'bookings'])
                queryClient.invalidateQueries(['bookings'])
        }})
}

export function useEditBooking() {
    const queryClient = useQueryClient()
    return useMutation<{ booking: Jsonify<BookingType> }, any, BookingType, any>(
        async data => (await axios.post('/api/booking/edit', { booking: data })).data,
        {  
            onSuccess: () => { 
                queryClient.invalidateQueries(['user', 'bookings'])
                queryClient.invalidateQueries(['bookings'])
        }}
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

export type eventTimelineQueryType = UseQueryOptions<{ "timeline": Jsonify<EventBookingTimelineType> }, any>
/* export function useEventTimeline(eventId) {
    return useQuery([eventId, 'bookings'],
        async () => (await axios.get(`/api/event/${eventId}/manage/timeline`)).data) as QueryObserverSuccessResult<{ "timeline": Jsonify<EventBookingTimelineType> }>
} */

export function useHistoricalEventBookings(eventId, timestamp) {
    return useQuery([eventId, 'bookings', timestamp],
        async () => (await axios.get(`/api/event/${eventId}/manage/bookings/${timestamp}`)).data) as QueryObserverSuccessResult<{ "bookings": [Jsonify<BookingType>] }>
}