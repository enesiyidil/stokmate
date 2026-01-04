import { baseApi } from '../api/base.api'

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
    acceptedQuantity: number
    note: string
    vehiclePlate: string
    driverInfo: string
    imageUrls: string[]
    acceptedByName: string
    acceptedByEmail: string
    acceptanceDate: string
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
    }),
})

export const {
    useAcceptProductMutation,
    useGetPendingProductsQuery,
    useGetOrderAcceptancesQuery,
} = productAcceptanceApi
