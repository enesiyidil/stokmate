import { baseApi } from '../api/base.api'

export interface SupportRequestResponse {
    id: string
    title: string
    description: string
    category: 'IT' | 'FACILITY' | 'OTHER'
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    createdById: string
    createdByName: string
    createdByEmail: string
    assignedToId?: string
    assignedToName?: string
    resolution?: string
    createdAt: string
    updatedAt: string
    resolvedAt?: string
}

export interface CreateSupportRequestRequest {
    title: string
    description?: string
    category: 'IT' | 'FACILITY' | 'OTHER'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface UpdateSupportRequestRequest {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
    resolution?: string
    assignedToId?: string
}

export const supportRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMyRequests: builder.query<SupportRequestResponse[], void>({
            query: () => '/support-requests/my',
            providesTags: ['Requests'],
        }),
        getAllRequests: builder.query<SupportRequestResponse[], void>({
            query: () => '/support-requests',
            providesTags: ['Requests'],
        }),
        createRequest: builder.mutation<SupportRequestResponse, CreateSupportRequestRequest>({
            query: (body) => ({
                url: '/support-requests',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Requests'],
        }),
        updateRequestStatus: builder.mutation<SupportRequestResponse, { id: string; data: UpdateSupportRequestRequest }>({
            query: ({ id, data }) => ({
                url: `/support-requests/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Requests'],
        }),
        cancelRequest: builder.mutation<void, string>({
            query: (id) => ({
                url: `/support-requests/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: ['Requests'],
        }),
        deleteRequest: builder.mutation<void, string>({
            query: (id) => ({
                url: `/support-requests/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Requests'],
        }),
    }),
})

export const {
    useGetMyRequestsQuery,
    useGetAllRequestsQuery,
    useCreateRequestMutation,
    useUpdateRequestStatusMutation,
    useCancelRequestMutation,
    useDeleteRequestMutation,
} = supportRequestApi
