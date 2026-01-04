import { api } from '../api/base.api'

export type OrderReceiptStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface OrderReceiptPhotoResponse {
    id: string
    fileName: string
    fileSize: number
    downloadUrl: string
}

export interface UserResponse {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role: string
}

export interface OrderReceiptResponse {
    id: string
    orderProductId: string
    productId?: string
    orderNo: string
    productCode: string
    productName: string
    receivedQuantity: number
    notes?: string
    vehiclePlate?: string
    driverName?: string
    driverPhone?: string
    status: OrderReceiptStatus
    receivedBy: UserResponse
    approvedBy?: UserResponse
    approvedAt?: string
    approvalNotes?: string
    createdAt: string
    updatedAt: string
    photos: OrderReceiptPhotoResponse[]
}

export interface OrderReceiptCreateRequest {
    orderProductId: string
    receivedQuantity: number
    notes?: string
    vehiclePlate?: string
    driverName?: string
    driverPhone?: string
}

export interface OrderReceiptApprovalRequest {
    approvalNotes?: string
}

export const orderReceiptApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Create order receipt (accept products)
        createOrderReceipt: builder.mutation<OrderReceiptResponse, { request: OrderReceiptCreateRequest; photos?: File[] }>({
            query: ({ request, photos }) => {
                const formData = new FormData()
                formData.append('orderProductId', request.orderProductId)
                formData.append('receivedQuantity', request.receivedQuantity.toString())
                if (request.notes) formData.append('notes', request.notes)
                if (request.vehiclePlate) formData.append('vehiclePlate', request.vehiclePlate)
                if (request.driverName) formData.append('driverName', request.driverName)
                if (request.driverPhone) formData.append('driverPhone', request.driverPhone)

                if (photos && photos.length > 0) {
                    photos.forEach((photo) => {
                        formData.append('photos', photo)
                    })
                }

                return {
                    url: '/order-receipts',
                    method: 'POST',
                    body: formData,
                }
            },
            invalidatesTags: ['OrderReceipts', 'Orders', 'Products'], // Also invalidate products to update stock
        }),

        // List all receipts with optional filters
        listOrderReceipts: builder.query<OrderReceiptResponse[], { orderId?: string; status?: OrderReceiptStatus }>({
            query: ({ orderId, status }) => ({
                url: '/order-receipts',
                params: {
                    ...(orderId && { orderId }),
                    ...(status && { status }),
                },
            }),
            providesTags: ['OrderReceipts'],
        }),

        // Get single receipt by ID
        getOrderReceipt: builder.query<OrderReceiptResponse, string>({
            query: (id) => `/order-receipts/${id}`,
            providesTags: ['OrderReceipts'],
        }),

        // Approve receipt
        approveOrderReceipt: builder.mutation<OrderReceiptResponse, { id: string; request?: OrderReceiptApprovalRequest }>({
            query: ({ id, request }) => ({
                url: `/order-receipts/${id}/approve`,
                method: 'POST',
                body: request || {},
            }),
            invalidatesTags: ['OrderReceipts', 'Orders'],
        }),

        // Reject receipt
        rejectOrderReceipt: builder.mutation<OrderReceiptResponse, { id: string; request?: OrderReceiptApprovalRequest }>({
            query: ({ id, request }) => ({
                url: `/order-receipts/${id}/reject`,
                method: 'POST',
                body: request || {},
            }),
            invalidatesTags: ['OrderReceipts', 'Orders'],
        }),

        // Get receipts for specific order
        getReceiptsForOrder: builder.query<OrderReceiptResponse[], string>({
            query: (orderId) => `/order-receipts/order/${orderId}`,
            providesTags: ['OrderReceipts'],
        }),
    }),
})

export const {
    useCreateOrderReceiptMutation,
    useListOrderReceiptsQuery,
    useGetOrderReceiptQuery,
    useApproveOrderReceiptMutation,
    useRejectOrderReceiptMutation,
    useGetReceiptsForOrderQuery,
} = orderReceiptApi
