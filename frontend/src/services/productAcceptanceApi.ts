import { baseApi } from '../api/base.api'
import type { PageResponse } from '../types/common'

export interface ProductAcceptanceRequest {
    orderProductId: string
    acceptedQuantity: number
    note: string
    vehiclePlate: string
    driverInfo: string
}

export interface ProductAcceptanceResponse {
    id: string
    orderNumber: string
    productName: string
    productCode: string
    brand?: string
    acceptedQuantity: number
    note: string
    vehiclePlate: string
    driverInfo: string
    imageUrls: string[]
    acceptedByName: string
    acceptedById?: string
    acceptedByEmail: string
    acceptanceDate: string
    approvedById?: string
    status: string
}

export interface PendingProductResponse {
    orderProductId: string
    orderId: string
    orderNumber: string
    productName: string
    productCode: string
    totalQuantity: number
    acceptedQuantity: number
    remainingQuantity: number
    convertedFromCustomer?: boolean // İptal stoğu siparişi mi?
}

export const productAcceptanceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        acceptProduct: builder.mutation<ProductAcceptanceResponse, { data: ProductAcceptanceRequest; images: File[] }>({
            query: ({ data, images }) => {
                const formData = new FormData()
                formData.append('orderProductId', data.orderProductId)
                formData.append('acceptedQuantity', data.acceptedQuantity.toString())
                formData.append('note', data.note)
                formData.append('vehiclePlate', data.vehiclePlate)
                formData.append('driverInfo', data.driverInfo)

                images.forEach((image) => {
                    formData.append('images', image)
                })

                return {
                    url: '/acceptances',
                    method: 'POST',
                    body: formData,
                }
            },
            invalidatesTags: ['Orders', 'ProductAcceptances'],
        }),

        getPendingProducts: builder.query<PendingProductResponse[], void>({
            query: () => '/acceptances/pending',
            providesTags: ['ProductAcceptances'],
        }),

        getOrderAcceptances: builder.query<ProductAcceptanceResponse[], string>({
            query: (orderId) => `/acceptances/order/${orderId}`,
            providesTags: (result, error, orderId) => [
                { type: 'ProductAcceptances', id: orderId },
            ],
        }),

        listAllAcceptances: builder.query<PageResponse<ProductAcceptanceResponse>, {
            page?: number;
            size?: number;
            search?: string;
            status?: string;
            brand?: string;
            acceptedBy?: string;
            approvedBy?: string;
        }>({
            query: (params) => ({
                url: '/acceptances',
                params: {
                    page: params.page || 0,
                    size: params.size || 50,
                    search: params.search,
                    status: params.status,
                    brand: params.brand,
                    acceptedBy: params.acceptedBy,
                    approvedBy: params.approvedBy,
                },
            }),
            providesTags: ['ProductAcceptances'],
        }),

        // Admin/Manager only: Delete a product acceptance
        deleteAcceptance: builder.mutation<void, string>({
            query: (acceptanceId) => ({
                url: `/acceptances/${acceptanceId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Orders', 'ProductAcceptances'],
        }),
    }),
})

export const {
    useAcceptProductMutation,
    useGetPendingProductsQuery,
    useGetOrderAcceptancesQuery,
    useListAllAcceptancesQuery,
    useDeleteAcceptanceMutation,
} = productAcceptanceApi

