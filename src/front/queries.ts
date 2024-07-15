import { QueryObserverSuccessResult, UseQueryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BookingType, EventBookingTimelineType, EventType, JsonApplicationType, JsonBookingType, JsonEventBookingTimelineType, JsonEventType, JsonRoleType, JsonUserResponseType, JsonUserType } from '../lambda-common/onetable.js'
import { SnackBarContext } from './app/toasts.js';
import { useContext } from 'react';
import { set } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ApplicationOperationType, BookingOperationType, EventOperationType } from '../shared/computedDataTypes.js';
import { HasSheetType } from '../lambda-common/sheets_input.js';
import { onSpaceOrEnter } from '@mui/x-date-pickers/internals';

export function useEnv() {
    return useSuspenseQuery({
        queryKey: ['env'],
        queryFn: async () => (await axios.get("/api/env")).data
    }) as QueryObserverSuccessResult<{ "env": string, "stripe": boolean }>;
}

export const userQuery = {
    queryKey: ['user'],
    queryFn: async () => (await axios.get("/api/user")).data,
    staleTime: 60 * 1000,
    cacheTime: 60 * 1000,
    refetchOnWindowFocus: true
}

export function useUser() {
    return useSuspenseQuery(userQuery) as QueryObserverSuccessResult<{ "user": JsonUserResponseType }>
}

export function useEditUser() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    const navigate = useNavigate()
    return useMutation<{ booking: JsonUserType }, any, JsonUserType, any>(
        {
            mutationFn: async data => (await axios.post('/api/user/edit', { user: data })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user']
                })
                setSnackbar({ message: "User updated", severity: 'success' })
                navigate("/")
            },

            onError: snackbarError(setSnackbar)
        });
}

export function useToggleEventEmail() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ eventId: string, state: boolean }, any, { eventId: string, state: boolean }, any>(
        {
            mutationFn: async data => (await axios.post('/api/user/toggleEventEmail', { eventId: data.eventId, state: data.state })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user']
                })
                setSnackbar({ message: "Preference Saved", severity: 'success' })
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
    const setSnackbar = useContext(SnackBarContext)
    return useMutation(
        {
            mutationFn: async data => (await axios.post('/api/event/create', { event: data })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['events']
                })
            },
            onError: snackbarError(setSnackbar)
        });
}

export function useUsersBookings() {
    return useSuspenseQuery(userBookingsQuery) as QueryObserverSuccessResult<{ "bookings": [JsonBookingType] }>
}

export function useEditEvent() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation(
        {
            mutationFn: async data => (await axios.post('/api/event/edit', { event: data })),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['events']
                })
            },
            onError: snackbarError(setSnackbar)
        });
}

export function useCreateBooking(event) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    const navigate = useNavigate()
    return useMutation<{ booking: JsonBookingType }, any, JsonBookingType, any>(
        {
            mutationFn: async data => (await axios.post('/api/booking/create', { booking: data })).data,
            onSuccess: () => {
                queryClient.resetQueries({
                    queryKey: ['user', 'bookings']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
                setSnackbar({ message: "Booking Created", severity: 'success' })
                navigate(`/event/${event.id}/thanks`)
            },
            onError: snackbarError(setSnackbar)
        });
}

export function useCreateApplication(event) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    const navigate = useNavigate()
    return useMutation<{ application: JsonApplicationType }, any, JsonApplicationType, any>(
        {
            mutationFn: async data => (await axios.post('/api/booking/apply', { application: data })).data,
            onSuccess: () => {
                queryClient.resetQueries({
                    queryKey: ['user']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
                setSnackbar({ message: "Application Created", severity: 'success' })
                navigate(`/event/${event.id}/applicationthanks`)
            },
            onError: snackbarError(setSnackbar)
        });
}

export function useEditBooking(user, event) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    const navigate = useNavigate()
    return useMutation<{}, any, JsonBookingType, any>(
        {
            mutationFn: async data => (await axios.post('/api/booking/edit', { booking: data })).data,
            onSuccess: (data, variables, context) => {
                queryClient.invalidateQueries({
                    queryKey: ['user', 'bookings']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
                setSnackbar({ message: "Booking Updated", severity: 'success' })
                const target = user.id === variables.userId ? `/event/${event.id}/thanks` : `/event/${event.id}/manage`
                navigate(target)
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

export function useDeleteBooking() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    const navigate = useNavigate()
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
                setSnackbar({ message: "Booking Cancelled", severity: 'success' })
                navigate(`/`)
            },
            onError: snackbarError(setSnackbar)
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

export function useParticipantNumbersChartData(eventId) {
    return useSuspenseQuery({
        queryKey: ['manage', eventId, 'bookings', 'chart'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/getParticipantNumbersChartData`)).data
    })
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

export type eventApplicationsQueryType = UseQueryOptions<{ "applications": [JsonApplicationType] }, any>

export const eventApplicationsQuery = eventId => {
    return {
        queryKey: ['manage', eventId, 'applications'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/manage/applications`)).data
    }
}

export function useEventApplications(eventId) {
    return useSuspenseQuery(eventApplicationsQuery(eventId)) as QueryObserverSuccessResult<{ "applications": [JsonApplicationType] }>
}

export type eventRolesQueryType = UseQueryOptions<{ "roles": [JsonRoleType] }, any>

//This does not depend on the eventId, but we use it to make checking permission simpler
export const allUsersQuery = eventId => {
    return {
        queryKey: ['users'],
        queryFn: async () => (await axios.get(`/api/user/list/${eventId}`)).data
    }
}

export const useAllUsersQuery = eventId => useSuspenseQuery(allUsersQuery(eventId)) as QueryObserverSuccessResult<{ "users": [JsonUserType] }>

export type allUsersQueryType = UseQueryOptions<{ "users": [JsonUserType] }, any>

export function useCreateRole(eventId) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ role: JsonRoleType }, any, JsonRoleType, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${eventId}/manage/roles/create`, { role: data })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['manage', eventId, 'roles']
                })
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

export function useDeleteRole(eventId) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ role: string }, any, string, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${eventId}/manage/roles/delete`, { role: data })).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['manage', eventId, 'roles']
                })
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

export function useDisableDriveSync() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<any, any, string, any>(
        {
            mutationFn: async data => (await axios.post(`/api/user/disableDriveSync`)).data,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['user']
                })
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

export function useBookingOperation() {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ message: string }, any, { eventId: string, userId: string, operation: BookingOperationType }, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${data.eventId}/manage/booking/${data.userId}/operation`, { operation: data.operation })).data,
            onSuccess: (data) => {
                queryClient.invalidateQueries({
                    queryKey: ['manage']
                })
                setSnackbar({ message: data.message, severity: 'success' })
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

const snackbarError = (setSnackbar) => (error, variables, context) => {
    if (error.response) {
        if (error.response.status == 401) {
            setSnackbar({ message: `Permission Denied: ${error.response.data.message}`, severity: 'warning' })
        } else {
            setSnackbar({ message: `Server Error (${error.response.status}): ${error.response.data.message}`, severity: 'error' })
        }
    } else {
        setSnackbar({ message: `Unknown Error`, severity: 'error' })
    }
}

export function useApplicationOperation(eventId) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ message: string }, any, { userId: String, operation: ApplicationOperationType }, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${eventId}/manage/application/${data.userId}/operation`, { operation: data.operation })).data,
            onSuccess: (data) => {
                queryClient.invalidateQueries({
                    queryKey: ['manage', eventId, 'applications']
                })
                queryClient.invalidateQueries({
                    queryKey: ['manage', eventId, 'roles']
                })
                setSnackbar({ message: data.message, severity: 'success' })
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

export function useEventOperation(eventId) {
    const queryClient = useQueryClient()
    const setSnackbar = useContext(SnackBarContext)
    return useMutation<{ message: string }, any, { operation: EventOperationType }, any>(
        {
            mutationFn: async data => (await axios.post(`/api/event/${eventId}/manage/operation`, { operation: data.operation })).data,
            onSuccess: (data) => {
                queryClient.invalidateQueries({
                    queryKey: ['events']
                })
                setSnackbar({ message: data.message, severity: 'success' })
            },
            onError: snackbarError(setSnackbar)
        }
    );
}

export function useHasSheet(eventId) {
    return useSuspenseQuery({
        queryKey: ['event', eventId, 'hasSheet'],
        queryFn: async () => (await axios.get(`/api/event/${eventId}/sheet`)).data
    }) as QueryObserverSuccessResult<{ sheet: HasSheetType }>;
}

export function useCreateSheet(eventId) {
    const queryClient = useQueryClient()
    return useMutation<{ sheet: HasSheetType }, any, JsonBookingType["basic"]>({
        mutationFn: async (data) => (await axios.post(`/api/event/${eventId}/createSheet`, data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['event', eventId, 'hasSheet']
            })
        },
    })
}

export function useGetParticipantsFromSheet(eventId) {
    return useMutation<{ participants: JsonBookingType["participants"] }>({
        mutationFn: async () => (await axios.get(`/api/event/${eventId}/getParticipantsFromSheet`)).data
    })
}
