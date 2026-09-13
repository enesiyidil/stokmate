import { api } from '../api/base.api'
import type { CustomerRequest } from './customerApi'

export type OrderStatus =
    | 'CREATED'
    | 'PENDING_ACCEPTANCE'
    | 'PARTIALLY_ACCEPTED'
    | 'ACCEPTED'
    | 'PENDING_SHIPMENT_APPROVAL'
    | 'SHIPMENT_APPROVED'
    | 'IN_SHIPMENT'
    | 'PARTIALLY_SHIPPED'
    | 'DELIVERED'
    | 'PROBLEMATIC_DELIVERY'
    | 'SSH_ORDER_CREATED'
    | 'COMPLETED'
    | 'CANCELLATION_PENDING_APPROVAL'
    | 'CANCELLED'
    | 'DEVAM_EDIYOR'  // Legacy
    | 'TAMAMLANDI'    // Legacy
    | 'IPTAL_EDILDI'  // Legacy

export interface OrderProductResponse {
    id: string
    productCode: string
    productName: string
    quantity: number
    acceptedQuantity?: number
    remainingQuantity?: number
    shippedQuantity?: number
    pendingShipmentQuantity?: number
    availableForShipmentQuantity?: number
    remainingShipQuantity?: number
    unitPrice?: number
    totalPrice?: number
    brand?: string
    createdAt: string
    updatedAt: string
    // Price fields
    grossPrice?: number
    netPrice?: number
    fixedDiscount?: number
    cashDiscount?: number
    displayDiscount?: number
    discount1?: number
    discount2?: number
    discount3?: number
    discount4?: number
    discount5?: number
    vat?: number
    paymentCondition?: string
    paymentConditionDefinition?: string
    specName?: string
    productGroupDefinition?: string
    warehouseLocation?: string
    productionLocationName?: string
}

export interface UserBasicResponse {
    id: string
    firstName: string
    lastName: string
    email: string
}

export interface OrderEventResponse {
    id: string
    orderId: string
    eventType: string
    eventData: Record<string, any>
    createdBy: UserBasicResponse
    createdAt: string
}

export interface PartialDeliveryUpdateRequest {
    partialDeliveryMarked: boolean
    notes?: string
}

export interface UpdateSalesConsultantRequest {
    salesConsultantId?: string
}

export interface UpdateOrderRequest {
    orderNo?: string
    prosapContractNo?: string
    prosapContractNameSurname?: string
    orderDate?: string
    customerId?: string
    salesConsultantId?: string
    orderNotes?: string
    shipmentNote?: string
}

export interface ProductShipmentRequest {
    orderProductId: string
    quantityToShip: number
}

export interface PartialShipmentRequest {
    orderId: string
    productShipments: ProductShipmentRequest[]
    notes?: string
}

export interface OrderResponse {
    id: string
    orderNo: string
    prosapContractNo?: string
    prosapContractNameSurname?: string
    orderDate: string
    products: OrderProductResponse[]
    status: string
    orderType?: 'STOCK' | 'CUSTOMER_SPECIFIC' | 'AFTER_SALES_SERVICE'
    productsAccepted: boolean
    invoiceFileKey?: string
    hasInvoice: boolean
    createdAt: string
    updatedAt: string
    customer?: {
        id: string
        firstName: string
        lastName: string
        phone?: string
        email?: string
        city?: string
        fullAddress?: string
    }
    salesConsultant?: {
        id: string
        firstName: string
        lastName: string
        email?: string
        phone?: string
    }
    // Partial delivery fields (ORDER level)
    partialDeliveryMarked?: boolean
    deliveryNotes?: string
    deliveryLastUpdatedBy?: UserBasicResponse
    deliveryLastUpdatedAt?: string
    // Brand info
    brand?: string
    // SSH from problematic shipment fields
    parentOrderId?: string
    hidden?: boolean
    linkedShipmentId?: string
    childSshOrders?: SshOrderSummary[]
    problemShipments?: ProblemShipmentSummary[]
    // Flag to indicate this order was converted from a customer-specific order (iptal stoğu)
    convertedFromCustomer?: boolean
    shipmentNote?: string
}

export interface SshOrderSummary {
    id: string
    orderNo: string
    linkedShipmentId: string
    problemType: string
    orderDate: string
}

export interface ProblemShipmentSummary {
    shipmentId: string
    problemType: string
    completedAt: string
    hasSshOrder: boolean
    sshOrderId?: string
}

export interface OrderProductExcelRow {
    orderNo: string
    contractNo: string
    itemDescription?: string
    quantity: number
    productCode: string
    productName: string
    // Price and discount fields from Excel
    specName?: string
    productGroupDefinition?: string
    warehouseLocation?: string
    productionLocationName?: string
    grossPrice?: number
    netPrice?: number
    fixedDiscount?: number
    cashDiscount?: number
    displayDiscount?: number
    discount1?: number
    discount2?: number
    discount3?: number
    discount4?: number
    discount5?: number
    vat?: number
    paymentCondition?: string
    paymentConditionDefinition?: string
}

export interface OrderGroupData {
    orderNo: string
    prosapContractNo: string
    prosapContractNameSurname: string
    orderDate: string
    products: OrderProductExcelRow[]
    shipmentNote?: string
}

export interface ExcelExtractionResponse {
    orders: OrderGroupData[]
    totalOrders: number
    totalProducts: number
    extractionStatus: 'SUCCESS' | 'PARTIAL' | 'ERROR'
    message: string
}

export interface OrderProductCreateRequest {
    productCode: string
    productName: string
    quantity: number
    specName?: string
    productGroupDefinition?: string
    warehouseLocation?: string
    productionLocationName?: string
    grossPrice?: number
    netPrice?: number
    fixedDiscount?: number
    cashDiscount?: number
    displayDiscount?: number
    discount1?: number
    discount2?: number
    discount3?: number
    discount4?: number
    discount5?: number
    vat?: number
    paymentCondition?: string
    paymentConditionDefinition?: string
}

export interface OrderCreateRequest {
    orderNo: string
    prosapContractNo: string
    prosapContractNameSurname: string
    orderDate: string
    orderType?: 'STOCK' | 'CUSTOMER_SPECIFIC' | 'AFTER_SALES_SERVICE'
    salesConsultantId?: string
    products: OrderProductCreateRequest[]
    customerId?: string // Use existing customer
    customerData?: CustomerRequest // Create new customer
    // SSH order fields
    parentOrderId?: string
    linkedShipmentId?: string
    hidden?: boolean
    shipmentNote?: string
}

export interface InvoiceUrlResponse {
    url: string
}

// Dashboard Stats DTO
export interface StatItem {
    value: string;
    subValue: string;
    trend: string;
    trendType: 'up' | 'down' | 'neutral';
}

export interface DashboardStatsDTO {
    totalOrders: StatItem;
    activeStaff: StatItem;
    totalShipments: StatItem;
    totalSales: StatItem;
}

export const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get dashboard stats
        getDashboardStats: builder.query<DashboardStatsDTO, void>({
            query: () => '/dashboard/stats',
        }),
        // List all orders (paginated)
        listOrders: builder.query<import('../types/common').PageResponse<OrderResponse>, {
            page?: number; size?: number; search?: string;
            statusGroup?: string; orderType?: string; brand?: string;
            consultantId?: string; includeHidden?: boolean
        }>({
            query: (params) => ({
                url: '/orders',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 50,
                    ...(params.search && { search: params.search }),
                    ...(params.statusGroup && { statusGroup: params.statusGroup }),
                    ...(params.orderType && { orderType: params.orderType }),
                    ...(params.brand && { brand: params.brand }),
                    ...(params.consultantId && { consultantId: params.consultantId }),
                    includeHidden: params.includeHidden ?? true,
                },
            }),
            providesTags: ['Orders'],
        }),

        // Get single order by ID
        getOrder: builder.query<OrderResponse, string>({
            query: (id) => `/orders/${id}`,
            providesTags: ['Orders'],
        }),

        // Extract data from Excel
        extractFromExcel: builder.mutation<ExcelExtractionResponse, FormData>({
            query: (formData) => ({
                url: '/orders/extract-excel',
                method: 'POST',
                body: formData,
            }),
        }),

        // Create order
        createOrder: builder.mutation<OrderResponse, OrderCreateRequest>({
            query: (data) => ({
                url: '/orders',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Orders'],
        }),

        // Complete order
        completeOrder: builder.mutation<OrderResponse, string>({
            query: (id) => ({
                url: `/orders/${id}/complete`,
                method: 'POST',
            }),
            invalidatesTags: ['Orders'],
        }),

        // Cancel order
        cancelOrder: builder.mutation<OrderResponse, string>({
            query: (id) => ({
                url: `/orders/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: ['Orders'],
        }),

        // Approve order cancellation
        approveCancellation: builder.mutation<OrderResponse, string>({
            query: (id) => ({
                url: `/orders/${id}/approve-cancellation`,
                method: 'POST',
            }),
            invalidatesTags: ['Orders'],
        }),

        // Accept products
        acceptProducts: builder.mutation<OrderResponse, string>({
            query: (id) => ({
                url: `/orders/${id}/accept-products`,
                method: 'POST',
            }),
            invalidatesTags: ['Orders'],
        }),

        // Upload invoice
        uploadInvoice: builder.mutation<OrderResponse, { id: string; file: FormData }>({
            query: ({ id, file }) => ({
                url: `/orders/${id}/invoice`,
                method: 'POST',
                body: file,
            }),
            invalidatesTags: ['Orders'],
        }),

        // Get invoice URL
        getInvoiceUrl: builder.query<InvoiceUrlResponse, string>({
            query: (id) => `/orders/${id}/invoice`,
        }),

        // List pending acceptance orders
        listPendingAcceptanceOrders: builder.query<OrderResponse[], void>({
            query: () => '/orders/pending-acceptance',
            providesTags: ['Orders'],
        }),

        // Get orders by customer ID
        getOrdersByCustomer: builder.query<OrderResponse[], string>({
            query: (customerId) => `/orders/by-customer/${customerId}`,
            providesTags: ['Orders'],
        }),

        // Approve shipment for an order
        approveShipment: builder.mutation<OrderResponse, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}/approve-shipment`,
                method: 'POST',
            }),
            invalidatesTags: ['Orders'],
        }),

        // Update partial delivery status
        updatePartialDelivery: builder.mutation<OrderResponse, { orderId: string; data: PartialDeliveryUpdateRequest }>({
            query: ({ orderId, data }) => ({
                url: `/orders/${orderId}/partial-delivery`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Orders'],
        }),

        // Update sales consultant
        updateSalesConsultant: builder.mutation<OrderResponse, { orderId: string; data: UpdateSalesConsultantRequest }>({
            query: ({ orderId, data }) => ({
                url: `/orders/${orderId}/sales-consultant`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Orders'],
        }),

        // Update brand for all products in order
        updateBrand: builder.mutation<OrderResponse, { orderId: string; brand: string }>({
            query: ({ orderId, brand }) => ({
                url: `/orders/${orderId}/brand`,
                method: 'PATCH',
                body: { brand },
            }),
            invalidatesTags: ['Orders'],
        }),

        // Get order events
        getOrderEvents: builder.query<OrderEventResponse[], string>({
            query: (orderId) => `/orders/${orderId}/events`,
        }),

        // Get order notes
        getOrderNotes: builder.query<OrderNoteResponse[], string>({
            query: (orderId) => `/orders/${orderId}/notes`,
            providesTags: ['Orders'],
        }),

        // Add note to order
        addOrderNote: builder.mutation<OrderNoteResponse, { orderId: string; content: string }>({
            query: ({ orderId, content }) => ({
                url: `/orders/${orderId}/notes`,
                method: 'POST',
                body: { content },
            }),
            invalidatesTags: ['Orders'],
        }),

        // Strike through note
        strikeOrderNote: builder.mutation<OrderNoteResponse, { orderId: string; noteId: string }>({
            query: ({ orderId, noteId }) => ({
                url: `/orders/${orderId}/notes/${noteId}/strike`,
                method: 'PUT',
            }),
            invalidatesTags: ['Orders'],
        }),
        // Get recent system activities
        getRecentSystemActivities: builder.query<OrderActivityResponse[], void>({
            query: () => '/order-activities/recent',
        }),

        // Get all system activities (paginated)
        getAllSystemActivities: builder.query<{ content: OrderActivityResponse[]; totalElements: number; totalPages: number }, { page: number; size: number; category?: string; search?: string }>({
            query: ({ page, size, category, search }) => ({
                url: '/order-activities',
                params: {
                    page,
                    size,
                    category,
                    search,
                },
            }),
            providesTags: ['Orders'],
        }),

        // Get unified business activities
        getBusinessActivities: builder.query<{ content: BusinessActivity[]; totalElements: number; totalPages: number }, { page: number; size: number; category?: string; search?: string }>({
            query: ({ page, size, category, search }) => ({
                url: '/business-activities',
                params: {
                    page,
                    size,
                    category,
                    search,
                },
            }),
            providesTags: ['Orders'], // Re-using Orders tag for simplicity, ideally should be generic
        }),

        // Hard delete order
        deleteOrder: builder.mutation<void, string>({
            query: (id) => ({
                url: `/orders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Orders'],
        }),

        // Full update order
        updateOrder: builder.mutation<OrderResponse, { id: string; data: UpdateOrderRequest }>({
            query: ({ id, data }) => ({
                url: `/orders/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Orders'],
        }),
    }),
})

export interface BusinessActivity {
    id: string
    domain: 'ORDER' | 'SALE'
    activityType: string
    description: string
    createdAt: string
    userId: string
    userFullName: string
    userEmail: string
    referenceId: string
    referenceNo: string
}

export interface OrderActivityResponse {
    id: string
    orderId: string
    orderNo: string
    userId: string
    userEmail: string
    userFullName: string
    activityType: string
    description: string
    createdAt: string
}

export interface OrderNoteResponse {
    id: string
    content: string
    strikethrough: boolean
    createdByName: string
    createdByEmail: string
    createdAt: string
    strikethroughByName?: string
    strikethroughAt?: string
}

export const {
    useListOrdersQuery,
    useGetOrderQuery,
    useExtractFromExcelMutation,
    useCreateOrderMutation,
    useCompleteOrderMutation,
    useCancelOrderMutation,
    useApproveCancellationMutation,
    useAcceptProductsMutation,
    useUploadInvoiceMutation,
    useGetInvoiceUrlQuery,
    useListPendingAcceptanceOrdersQuery,
    useGetOrdersByCustomerQuery,
    useApproveShipmentMutation,
    useUpdatePartialDeliveryMutation,
    useUpdateSalesConsultantMutation,
    useUpdateBrandMutation,
    useGetOrderEventsQuery,
    useGetOrderNotesQuery,
    useAddOrderNoteMutation,
    useStrikeOrderNoteMutation,
    useGetRecentSystemActivitiesQuery,
    useGetAllSystemActivitiesQuery,
    useGetBusinessActivitiesQuery,
    useGetDashboardStatsQuery,
    useDeleteOrderMutation,
    useUpdateOrderMutation,
} = orderApi
