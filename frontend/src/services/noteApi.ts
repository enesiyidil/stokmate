import { api } from '../api/base.api';
import type { Note, NotePriority, NoteStatus, LinkedEntityType, PageResponse } from '../types/note';

export const noteApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getUserNotes: builder.query<
            PageResponse<Note>,
            {
                searchTerm?: string;
                priority?: NotePriority;
                status?: NoteStatus;
                tags?: NoteTag[];
                page?: number;
                size?: number;
                sortBy?: string;
                direction?: string;
            }
        >({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.searchTerm) searchParams.append('searchTerm', params.searchTerm);
                if (params.priority) searchParams.append('priority', params.priority);
                if (params.status) searchParams.append('status', params.status);
                params.tags?.forEach((tag) => searchParams.append('tags', tag));
                if (params.page !== undefined) searchParams.append('page', params.page.toString());
                if (params.size !== undefined) searchParams.append('size', params.size.toString());
                if (params.sortBy) searchParams.append('sortBy', params.sortBy);
                if (params.direction) searchParams.append('direction', params.direction);

                return `/notes?${searchParams.toString()}`;
            },
            providesTags: ['Note']
        }),
        getLinkedNotes: builder.query<Note[], { type: LinkedEntityType; id: string }>({
            query: ({ type, id }) => `/notes/linked/${type}/${id}`,
            providesTags: (_result: any, _error: any, arg: any) => [{ type: 'Note', id: `LINKED-${arg.type}-${arg.id}` }]
        }),
        getNote: builder.query<Note, string>({
            query: (id) => `/notes/${id}`,
            providesTags: (_result: any, _error: any, id: any) => [{ type: 'Note', id }]
        }),
        createNote: builder.mutation<Note, Partial<Note>>({
            query: (note) => ({
                url: '/notes',
                method: 'POST',
                body: note,
            }),
            invalidatesTags: ['Note']
        }),
        updateNote: builder.mutation<Note, { id: string; data: Partial<Note> }>({
            query: ({ id, data }) => ({
                url: `/notes/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result: any, _error: any, { id }: any) => [{ type: 'Note', id }, 'Note']
        }),
        deleteNote: builder.mutation<void, string>({
            query: (id) => ({
                url: `/notes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Note']
        }),
        toggleNoteItem: builder.mutation<Note, { noteId: string; itemId: number }>({
            query: ({ noteId, itemId }) => ({
                url: `/notes/${noteId}/items/${itemId}/toggle`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result: any, _error: any, { noteId }: any) => [{ type: 'Note', id: noteId }, 'Note']
        }),
    })
});

export const {
    useGetUserNotesQuery,
    useGetLinkedNotesQuery,
    useGetNoteQuery,
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
    useToggleNoteItemMutation
} = noteApi;
