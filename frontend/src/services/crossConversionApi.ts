import { api } from '../api/base.api'

export interface CrossConversionResponse {
    id: string
    customerId: string
    customerFirstName: string
    customerLastName: string
    orderId: string
    orderNo: string
    contractNo: string
    orderType: string
    sourceBrand: string
    targetBrand: string
    notes: string
    createdAt: string
    createdBy: string
}

export interface CrossConversionRequest {
    customerId: string
    orderId: string
    sourceBrand: string
    targetBrand: string
    notes?: string
}

export const crossConversionApi = api.injectEndpoints({
    endpoints: (builder) => ({
        listCrossConversions: builder.query<import('../types/common').PageResponse<CrossConversionResponse>, {
            page?: number; size?: number; search?: string; sourceBrand?: string; targetBrand?: string
        }>({
            query: (params) => ({
                url: '/cross-conversions',
                params: {
                    page: params?.page ?? 0,
                    size: params?.size ?? 50,
                    ...(params?.search && { search: params.search }),
                    ...(params?.sourceBrand && { sourceBrand: params.sourceBrand }),
                    ...(params?.targetBrand && { targetBrand: params.targetBrand }),
                }
            }),
            providesTags: ['CrossConversions'],
        }),
        getCrossConversion: builder.query<CrossConversionResponse, string>({
            query: (id) => `/cross-conversions/${id}`,
            providesTags: ['CrossConversions'],
        }),
        createCrossConversion: builder.mutation<CrossConversionResponse, CrossConversionRequest>({
            query: (data) => ({
                url: '/cross-conversions',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['CrossConversions'],
        }),
        updateCrossConversion: builder.mutation<CrossConversionResponse, { id: string; data: CrossConversionRequest }>({
            query: ({ id, data }) => ({
                url: `/cross-conversions/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['CrossConversions'],
        }),
        deleteCrossConversion: builder.mutation<void, string>({
            query: (id) => ({
                url: `/cross-conversions/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CrossConversions'],
        }),
    }),
})

export const {
    useListCrossConversionsQuery,
    useGetCrossConversionQuery,
    useCreateCrossConversionMutation,
    useUpdateCrossConversionMutation,
    useDeleteCrossConversionMutation,
} = crossConversionApi
