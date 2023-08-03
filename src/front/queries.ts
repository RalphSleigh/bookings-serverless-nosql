import { QueryObserverSuccessResult, UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BookingType, EventBookingTimelineType, EventType, JsonBookingType, JsonEventBookingTimelineType, JsonEventType, JsonRoleType, JsonUserResponseType, JsonUserType } from '../lambda-common/onetable.js'

export function useEnv() {
    return useQuery(['env'],
        async () => (await axios.get("/api/env")).data) as QueryObserverSuccessResult<{ "env": string }>
}

export const userQuery = {
    queryKey: ['user'],
    queryFn: async () => (await axios.get("/api/user")).data
}

export function useUser() {
    return useQuery(userQuery.queryKey, userQuery.queryFn) as QueryObserverSuccessResult<{ "user": JsonUserResponseType }>
}

export const eventsQuery = {
    queryKey: ['events'],
    queryFn: async () => (await axios.get("/api/events")).data
}

export function useEvents() {
    return useQuery(eventsQuery.queryKey, eventsQuery.queryFn) as QueryObserverSuccessResult<{ "events": [JsonEventType] }>
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
    return useQuery(userBookingsQuery.queryKey, userBookingsQuery.queryFn) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>
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
    return useMutation<{ booking: JsonBookingType }, any, JsonBookingType, any>(
        async data => (await axios.post('/api/booking/create', { booking: data })).data,
        {  
            onSuccess: () => { 
                queryClient.invalidateQueries(['user', 'bookings'])
                queryClient.invalidateQueries(['bookings'])
        }})
}

export function useEditBooking() {
    const queryClient = useQueryClient()
    return useMutation<{ booking: JsonBookingType }, any, JsonBookingType, any>(
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

export function useEventBookings(eventId) {
    const query = eventBookingsQuery(eventId)
    return useQuery(query.queryKey, query.queryFn) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>
}

export type eventBookingsQueryType = UseQueryOptions<{ "bookings": [JsonBookingType] }, any>

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

export function useEventTimeline(eventId) {
    const query = eventTimelineQuery(eventId)
    return useQuery(query.queryKey, query.queryFn) as QueryObserverSuccessResult<{ "timeline": JsonEventBookingTimelineType }>
}

export type eventTimelineQueryType = UseQueryOptions<{ "timeline": JsonEventBookingTimelineType }, any>
/* export function useEventTimeline(eventId) {
    return useQuery([eventId, 'bookings'],
        async () => (await axios.get(`/api/event/${eventId}/manage/timeline`)).data) as QueryObserverSuccessResult<{ "timeline": Jsonify<EventBookingTimelineType> }>
} */

export function useHistoricalEventBookings(eventId, timestamp) {
    return useQuery([eventId, 'bookings', timestamp],
        async () => (await axios.get(`/api/event/${eventId}/manage/bookings/${timestamp}`)).data) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>
}

export const eventRolesQuery = eventId => {
    return {
        queryKey: [eventId, 'roles'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/roles`)).data
    }
}

export function useEventRoles(eventId) {
    const query = eventRolesQuery(eventId)
    return useQuery(query.queryKey, query.queryFn) as QueryObserverSuccessResult<{ "roles": [JsonRoleType] }>
}

export type eventRolesQueryType = UseQueryOptions<{ "roles": [JsonRoleType] }, any>

//This does not depend on the eventId, but we use it to make checking permission simpler
export const allUsersQuery = eventId => {
    return {
        queryKey: ['users'],
        queryFn: async () => (await axios.get(`/api/user/list/${eventId}`)).data
    }
}

export type allUsersQueryType = UseQueryOptions<{ "users": [JsonUserType] }, any>