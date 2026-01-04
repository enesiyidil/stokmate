import { api } from '../api/base.api'
import type { CustomerRequest, CustomerResponse } from './customerApi'

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
    remainingShipQuantity?: number
    unitPrice?: number
    totalPrice?: number
    createdAt: string
    updatedAt: string
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
}

export interface InvoiceUrlResponse {
    url: string
}

export const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // List all orders or filter by status
        listOrders: builder.query<OrderResponse[], { status?: OrderStatus }>({
            query: ({ status }) => ({
                url: '/orders',
                params: status ? { status } : {},
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

        // Get order events
        getOrderEvents: builder.query<OrderEventResponse[], string>({
            query: (orderId) => `/orders/${orderId}/events`,
        }),
    }),
})
export const {
    useListOrdersQuery,
    useGetOrderQuery,
    useExtractFromExcelMutation,
    useCreateOrderMutation,
    useCompleteOrderMutation,
    useCancelOrderMutation,
    useAcceptProductsMutation,
    useUploadInvoiceMutation,
    useGetInvoiceUrlQuery,
    useListPendingAcceptanceOrdersQuery,
    useGetOrdersByCustomerQuery,
    useApproveShipmentMutation,
    useUpdatePartialDeliveryMutation,
    useUpdateSalesConsultantMutation,
    useGetOrderEventsQuery,
} = orderApi
