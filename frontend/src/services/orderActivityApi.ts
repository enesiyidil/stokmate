import { api } from '../api/base.api'

export type ActivityType =
    | 'CREATED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'PRODUCTS_ACCEPTED'
    | 'INVOICE_UPLOADED'
    | 'UPDATED'

export interface OrderActivityResponse {
    id: string
    orderId: string
    orderNo: string
    userId: string
    userEmail: string
    userFullName: string
    activityType: ActivityType
    description: string
    createdAt: string
}

export const orderActivityApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getOrderActivities: builder.query<OrderActivityResponse[], string>({
            query: (orderId) => `/order-activities/order/${orderId}`,
            providesTags: ['Orders'],
        }),
    }),
})

export const {
    useGetOrderActivitiesQuery,
} = orderActivityApi
