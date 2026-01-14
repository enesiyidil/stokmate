import { createApi } from '@reduxjs/toolkit/query/react';
import { baseApi } from '../api/base.api';

export interface Announcement {
    id: string;
    content: string;
    createdByFullName: string;
    createdAt: string;
}

export interface CreateAnnouncementRequest {
    content: string;
}

export const announcementApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAnnouncements: builder.query<Announcement[], void>({
            query: () => '/announcements',
            providesTags: ['Announcement'],
        }),
        createAnnouncement: builder.mutation<Announcement, CreateAnnouncementRequest>({
            query: (body) => ({
                url: '/announcements',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Announcement'],
        }),
        deleteAnnouncement: builder.mutation<void, string>({
            query: (id) => ({
                url: `/announcements/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Announcement'],
        }),
    }),
});

export const {
    useGetAnnouncementsQuery,
    useCreateAnnouncementMutation,
    useDeleteAnnouncementMutation,
} = announcementApi;
