import { QueryObserverSuccessResult, UseQueryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BookingType, EventBookingTimelineType, EventType, JsonBookingType, JsonEventBookingTimelineType, JsonEventType, JsonRoleType, JsonUserResponseType, JsonUserType } from '../lambda-common/onetable.js'
import { SnackBarContext } from './app/toasts.js';
import { useContext } from 'react';
import { set } from 'date-fns';

export function useEnv() {
    return useSuspenseQuery({
        queryKey: ['env'],
        queryFn: async () => (await axios.get("/api/env")).data
    }) as QueryObserverSuccessResult<{ "env": string }>;
}

export const userQuery = {
    queryKey: ['user'],
    queryFn: async () => (await axios.get("/api/user")).data
}

export function useUser() {
    return useSuspenseQuery(userQuery) as QueryObserverSuccessResult<{ "user": JsonUserResponseType }>
}

export function useEditUser() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ booking: JsonUserType }, any, JsonUserType, any>(
        {
            mutationFn: async data => (await axios.post('/api/user/edit', { user: data })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user']
                })
            },
            onError: snackbarError(setSnackbar)
        });
}

export const eventsQuery = {
    queryKey: ['events'],
    queryFn: async () => (await axios.get("/api/events")).data
}

export function useEvents() {
    return useSuspenseQuery(eventsQuery) as QueryObserverSuccessResult<{ "events": [JsonEventType] }>
}

export const userBookingsQuery = {
    queryKey: ['user', 'bookings'],
    queryFn: async () => (await axios.get("/api/booking/user")).data
}

export function useCreateEvent() {
    const queryClient = useQueryClient()
    return useMutation(
        {
            mutationFn: async data => (await axios.post('/api/event/create', { event: data })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['events']
                })
            }
        });
}

export function useUsersBookings() {
    return useSuspenseQuery(userBookingsQuery) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>
}

export function useEditEvent() {
    const queryClient = useQueryClient()
    return useMutation(
        {
            mutationFn: async data => (await axios.post('/api/event/edit', { event: data })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['events']
                })
            }
        });
}

export function useCreateBooking() {
    const queryClient = useQueryClient()
    return useMutation<{ booking: JsonBookingType }, any, JsonBookingType, any>(
        {
            mutationFn: async data => (await axios.post('/api/booking/create', { booking: data })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user', 'bookings']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
            }
        });
}

export function useEditBooking() {
    const queryClient = useQueryClient()
    return useMutation<{ booking: JsonBookingType }, any, JsonBookingType, any>(
        {
            mutationFn: async data => (await axios.post('/api/booking/edit', { booking: data })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user', 'bookings']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
            }
        }
    );
}

export function useDeleteBooking() {
    const queryClient = useQueryClient()
    return useMutation<{}, any, { eventId: string, userId: string }, any>(
        {
            mutationFn: async data => (await axios.post('/api/booking/delete', { booking: { eventId: data.eventId, userId: data.userId } })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user', 'bookings']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
            }
        }
    );
}

export const eventBookingsQuery = eventId => {
    return {
        queryKey: ['manage', eventId, 'bookings'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/bookings`)).data
    }
}

export function useEventBookings(eventId) {
    return useSuspenseQuery(eventBookingsQuery(eventId)) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>
}

export type eventBookingsQueryType = UseQueryOptions<{ "bookings": [JsonBookingType] }, any>

/* export function useEventBookings(eventId) {
    return useSuspenseQuery([eventId, 'bookings'],
        async () => (await axios.get(`/api/event/${eventId}/manage/bookings`)).data) as QueryObserverSuccessResult<{ "bookings": [Jsonify<BookingType>] }>
} */

export const eventTimelineQuery = eventId => {
    return {
        queryKey: ['manage', eventId, 'timeline'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/timeline`)).data
    }
}

export function useEventTimeline(eventId) {
    return useSuspenseQuery(eventTimelineQuery(eventId)) as QueryObserverSuccessResult<{ "timeline": JsonEventBookingTimelineType }>
}

export type eventTimelineQueryType = UseQueryOptions<{ "timeline": JsonEventBookingTimelineType }, any>
/* export function useEventTimeline(eventId) {
    return useSuspenseQuery([eventId, 'bookings'],
        async () => (await axios.get(`/api/event/${eventId}/manage/timeline`)).data) as QueryObserverSuccessResult<{ "timeline": Jsonify<EventBookingTimelineType> }>
} */

export function useHistoricalEventBookings(eventId, timestamp) {
    return useSuspenseQuery({
        queryKey: ['manage', eventId, 'bookings', timestamp],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/bookings/${timestamp}`)).data
    }) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>;
}

export const eventRolesQuery = eventId => {
    return {
        queryKey: ['manage', eventId, 'roles'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/roles`)).data
    }
}

export function useEventRoles(eventId) {
    return useSuspenseQuery(eventRolesQuery(eventId)) as QueryObserverSuccessResult<{ "roles": [JsonRoleType] }>
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

export function useCreateRole(eventId) {
    const queryClient = useQueryClient()
    return useMutation<{ role: JsonRoleType }, any, JsonRoleType, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${eventId}/manage/roles/create`, { role: data })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['manage', eventId, 'roles']
                })
            }
        }
    );
}

export function useDeleteRole(eventId) {
    const queryClient = useQueryClient()
    return useMutation<{ role: string }, any, string, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${eventId}/manage/roles/delete`, { role: data })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['manage', eventId, 'roles']
                })
            }
        }
    );
}

export function useDisableDriveSync() {
    const queryClient = useQueryClient()
    return useMutation<any, any, string, any>(
        {
            mutationFn: async data => (await axios.post(`/api/user/disableDriveSync`)).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user']
                })
            }
        }
    );
}

const snackbarError = (setSnackbar) => (error, variables, context) => {
    if(error.response.status == 401) {
        setSnackbar({message: `Permission Denied: ${error.response.data.message}`, severity: 'warning'})
    } else if (error.response.status >= 500) {
        setSnackbar({message:  `Server Error (${error.response.status}): ${error.response.data.message}`, severity: 'error'})
    } else {
        setSnackbar({message: `Unknown Error (${error.response.status}): ${error.response.data.message}`, severity: 'error'})
    }
}
