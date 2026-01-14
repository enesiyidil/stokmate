import { baseApi } from '../api/base.api'

export interface NotificationResponse {
    id: string
    type: 'SHIPMENT_APPROVAL_PENDING' | 'PRODUCT_ACCEPTANCE_PENDING' | 'SUPPORT_REQUEST_CREATED' | 'SUPPORT_REQUEST_RESOLVED' | 'ORDER_STATUS_CHANGED'
    title: string
    message: string
    linkUrl: string
    isRead: boolean
    createdAt: string
    readAt?: string
}

export interface UnreadCountResponse {
    count: number
}

export const notificationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllNotifications: builder.query<NotificationResponse[], void>({
            query: () => '/notifications',
            providesTags: ['Notifications'],
        }),
        getUnreadNotifications: builder.query<NotificationResponse[], void>({
            query: () => '/notifications/unread',
            providesTags: ['Notifications'],
        }),
        getUnreadCount: builder.query<UnreadCountResponse, void>({
            query: () => '/notifications/count',
            providesTags: ['Notifications'],
        }),
        markAsRead: builder.mutation<void, string>({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAllAsRead: builder.mutation<void, void>({
            query: () => ({
                url: '/notifications/read-all',
                method: 'POST',
            }),
            invalidatesTags: ['Notifications'],
        }),
    }),
})

export const {
    useGetAllNotificationsQuery,
    useGetUnreadNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} = notificationApi
