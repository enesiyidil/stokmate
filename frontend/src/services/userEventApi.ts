import { api } from '../api/base.api';

export interface UserEventRequest {
    title: string;
    description?: string;
    startDateTime: string; // ISO string
    endDateTime: string; // ISO string
    reminderType: 'NONE' | 'AT_TIME_OF_EVENT' | 'MIN_15_BEFORE' | 'HOUR_1_BEFORE' | 'DAY_1_BEFORE';
}

export interface UserEventResponse {
    id: string;
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    reminderType: string;
    isNotified: boolean;
    type?: string;
}

export const userEventApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getEvents: builder.query<UserEventResponse[], { start: string; end: string }>({
            query: ({ start, end }) => ({
                url: '/events',
                params: { start, end },
            }),
            providesTags: ['Events'],
        }),
        createEvent: builder.mutation<UserEventResponse, UserEventRequest>({
            query: (data) => ({
                url: '/events',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Events'],
        }),
        updateEvent: builder.mutation<UserEventResponse, { id: string; data: UserEventRequest }>({
            query: ({ id, data }) => ({
                url: `/events/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Events'],
        }),
        deleteEvent: builder.mutation<void, string>({
            query: (id) => ({
                url: `/events/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Events'],
        }),
    }),
});

export const {
    useGetEventsQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
} = userEventApi;
