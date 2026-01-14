import { api } from '../api/base.api'

export interface DeliveryProductInfo {
    name: string
    code: string
    quantity: number
}

export interface DeliverySessionResponse {
    shipmentId: string
    customerName: string
    customerAddress: string
    customerPhone: string
    products: DeliveryProductInfo[]
    completed: boolean
}

export const deliveryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        validateSession: builder.query<DeliverySessionResponse, string>({
            query: (token) => `/delivery/session/${token}`,
        }),
        completeDelivery: builder.mutation<void, { token: string; data: FormData }>({
            query: ({ token, data }) => ({
                url: `/delivery/complete/${token}`,
                method: 'POST',
                body: data,
            }),
        }),
    }),
})

export const { useValidateSessionQuery, useCompleteDeliveryMutation } = deliveryApi
