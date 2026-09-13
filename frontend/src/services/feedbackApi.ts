import { baseApi } from '../api/base.api'

export type FeedbackType = 'BUG_REPORT' | 'FEATURE_REQUEST' | 'SUGGESTION' | 'GENERAL'
export type FeedbackSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type FeedbackStatus = 'NEW' | 'REVIEWED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'WONT_FIX' | 'CLOSED'

export interface FeedbackSummaryResponse {
    id: string
    type: FeedbackType
    title: string
    status: FeedbackStatus
    severity: FeedbackSeverity | null
    rating: number | null
    createdByName: string
    createdByEmail: string
    createdAt: string
    responseCount: number
}

export interface FeedbackResponseDto {
    id: string
    message: string
    createdByName: string
    createdByRole: string | null
    createdAt: string
}

export interface FeedbackDetailResponse {
    id: string
    type: FeedbackType
    title: string
    description: string
    pageUrl: string | null
    severity: FeedbackSeverity | null
    status: FeedbackStatus
    rating: number | null
    adminNote: string | null
    createdById: string
    createdByName: string
    createdByEmail: string
    createdAt: string
    updatedAt: string
    responses: FeedbackResponseDto[]
}

export interface CreateFeedbackRequest {
    title: string
    description: string
    type: FeedbackType
    severity?: FeedbackSeverity
    pageUrl?: string
    rating?: number
}

export interface UpdateFeedbackStatusRequest {
    status?: FeedbackStatus
    adminNote?: string
}

export interface CreateFeedbackResponseRequest {
    message: string
}

export interface FeedbackStatsResponse {
    total: number
    newCount: number
    reviewedCount: number
    inProgressCount: number
    implementedCount: number
    closedCount: number
    wontFixCount: number
    bugReportCount: number
    featureRequestCount: number
    suggestionCount: number
    generalCount: number
}

export const feedbackApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMyFeedbacks: builder.query<FeedbackSummaryResponse[], void>({
            query: () => '/feedbacks/my',
            providesTags: ['Feedbacks'],
        }),
        getAllFeedbacks: builder.query<FeedbackSummaryResponse[], { status?: FeedbackStatus; type?: FeedbackType }>({
            query: (params) => {
                const searchParams = new URLSearchParams()
                if (params?.status) searchParams.set('status', params.status)
                if (params?.type) searchParams.set('type', params.type)
                const qs = searchParams.toString()
                return `/feedbacks${qs ? `?${qs}` : ''}`
            },
            providesTags: ['Feedbacks'],
        }),
        getFeedbackDetail: builder.query<FeedbackDetailResponse, string>({
            query: (id) => `/feedbacks/${id}`,
            providesTags: ['Feedbacks'],
        }),
        createFeedback: builder.mutation<FeedbackDetailResponse, CreateFeedbackRequest>({
            query: (body) => ({
                url: '/feedbacks',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Feedbacks'],
        }),
        updateFeedbackStatus: builder.mutation<FeedbackDetailResponse, { id: string; data: UpdateFeedbackStatusRequest }>({
            query: ({ id, data }) => ({
                url: `/feedbacks/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Feedbacks'],
        }),
        addFeedbackResponse: builder.mutation<FeedbackResponseDto, { id: string; data: CreateFeedbackResponseRequest }>({
            query: ({ id, data }) => ({
                url: `/feedbacks/${id}/responses`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Feedbacks'],
        }),
        deleteFeedback: builder.mutation<void, string>({
            query: (id) => ({
                url: `/feedbacks/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Feedbacks'],
        }),
        getFeedbackStats: builder.query<FeedbackStatsResponse, void>({
            query: () => '/feedbacks/stats',
            providesTags: ['Feedbacks'],
        }),
    }),
})

export const {
    useGetMyFeedbacksQuery,
    useGetAllFeedbacksQuery,
    useGetFeedbackDetailQuery,
    useCreateFeedbackMutation,
    useUpdateFeedbackStatusMutation,
    useAddFeedbackResponseMutation,
    useDeleteFeedbackMutation,
    useGetFeedbackStatsQuery,
} = feedbackApi
