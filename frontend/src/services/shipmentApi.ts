import { api } from '../api/base.api'
import type { PartialShipmentRequest } from './orderApi'

export interface ShipmentApprovalRequest {
    orderId: string
}

export interface ShipmentApprovalResponse {
    id: string
    orderId: string
    orderNo: string
    requestedById: string
    requestedByName: string
    requestDate: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    approvedById?: string
    approvedByName?: string
    approvalDate?: string
    rejectionReason?: string
}

export interface ShipmentResponse {
    id: string
    orderId: string
    orderNo: string
    plannedShipmentDate?: string
    actualShipmentDate?: string
    shippedById?: string
    shippedByName?: string
    deliveryStatus?: 'PROBLEM_FREE' | 'PROBLEMATIC'
    problemType?: 'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT'
    deliveryNotes?: string
    signedDocumentUrl?: string
    deliveryPhotoUrls?: string[]
    status: 'PENDING' | 'APPROVED' | 'PLANNED' | 'COMPLETED' | 'FINALIZED'
    approvedById?: string
    approvedByName?: string
    approvalDate?: string
}

export interface ShipmentDetailsResponse {
    shipmentId?: string
    orderId: string
    orderNo: string
    orderType: 'ORDER' | 'SALE'
    shipmentType?: 'ORDER' | 'SALE'  // Added for distinguishing sale vs order shipments
    saleId?: string
    saleNo?: string
    orderDate: string
    contractNo?: string
    customer: {
        name: string
        phone: string
        alternatePhone?: string
        address: string
    }
    salesConsultant?: {
        id: string
        name: string
    }
    driver?: {
        id: string
        name: string
    }
    vehicle?: {
        id: string
        licensePlate: string
        vehicleType: string
    }
    products: ProductShipmentDetail[]
    shipmentStatus: string
    plannedShipmentDate?: string
    approvedBy?: string
    deliveryStatus?: 'PROBLEM_FREE' | 'PROBLEMATIC'
    problemType?: 'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT'
    deliveryNotes?: string
    signedDocumentUrl?: string
    deliveryPhotoUrls?: string[]
}

export interface ProductShipmentDetail {
    productCode: string
    productName: string
    totalQuantity: number
    shippedQuantity: number
    pendingQuantity: number
    remainingQuantity: number
}

export interface VehicleResponse {
    id: string
    licensePlate: string
    vehicleType: string
}

export interface PlannedShipmentRequest {
    plannedDate: string
    vehicleId: string
    driverId?: string
}

export interface UpdateDriverRequest {
    driverId: string
}

export const shipmentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        approveShipment: builder.mutation<ShipmentApprovalResponse, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}/approve-shipment`,
                method: 'POST'
            }),
            invalidatesTags: ['Orders']
        }),
        // First approval: PENDING -> APPROVED
        approveInitialShipment: builder.mutation<ShipmentResponse, string>({
            query: (shipmentId) => ({
                url: `/shipment/${shipmentId}/approve-initial`,
                method: 'POST'
            }),
            invalidatesTags: ['Orders']
        }),
        listPendingShipments: builder.query<ShipmentResponse[], void>({
            query: () => '/shipment/pending-approval',
            providesTags: ['Orders']
        }),
        listAwaitingPlanningShipments: builder.query<ShipmentResponse[], void>({
            query: () => '/shipment/awaiting-planning',
            providesTags: ['Orders']
        }),
        listReadyShipments: builder.query<ShipmentResponse[], void>({
            query: () => '/shipment/ready',
            providesTags: ['Orders']
        }),
        createPartialShipment: builder.mutation<void, PartialShipmentRequest>({
            query: (data) => ({
                url: '/shipment/partial',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Orders']
        }),
        completeShipment: builder.mutation<ShipmentResponse, FormData>({
            query: (formData) => ({
                url: '/shipment/complete',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['Orders']
        }),
        finalizeShipment: builder.mutation<ShipmentResponse, string>({
            query: (shipmentId) => ({
                url: `/shipment/${shipmentId}/finalize`,
                method: 'POST'
            }),
            invalidatesTags: ['Orders']
        }),
        getShipmentDetails: builder.query<ShipmentDetailsResponse, string>({
            query: (orderId) => `/shipment/details/${orderId}`,
            providesTags: ['Orders']
        }),
        getShipmentDetailsById: builder.query<ShipmentDetailsResponse, string>({
            query: (shipmentId) => `/shipment/details/shipment/${shipmentId}`,
            providesTags: ['Orders']
        }),
        planShipment: builder.mutation<void, { orderId: string; data: PlannedShipmentRequest }>({
            query: ({ orderId, data }) => ({
                url: `/shipment/${orderId}/plan`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Orders']
        }),
        updateShipmentDriver: builder.mutation<void, { orderId: string; data: UpdateDriverRequest }>({
            query: ({ orderId, data }) => ({
                url: `/shipment/${orderId}/driver`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ['Orders']
        }),
        listVehicles: builder.query<VehicleResponse[], void>({
            query: () => '/vehicles',
            providesTags: ['Vehicles']
        }),
        downloadShipmentReport: builder.mutation<Blob, string>({
            query: (orderId) => ({
                url: `/shipment/${orderId}/report`,
                method: 'GET',
                responseHandler: async (response) => {
                    return response.blob()
                },
                cache: 'no-cache'
            })
        }),
        downloadShipmentReportByShipmentId: builder.mutation<Blob, string>({
            query: (shipmentId) => ({
                url: `/shipment/by-shipment/${shipmentId}/report`,
                method: 'GET',
                responseHandler: async (response) => {
                    return response.blob()
                },
                cache: 'no-cache'
            })
        }),
        downloadSignedDocument: builder.mutation<Blob, string>({
            query: (shipmentId) => ({
                url: `/shipment/${shipmentId}/signed-document`,
                method: 'GET',
                responseHandler: async (response) => {
                    return response.blob()
                },
                cache: 'no-cache'
            })
        }),
        // New endpoints for sale shipments and enhanced workflow
        createSaleShipment: builder.mutation<void, { saleId: string; products: { saleProductId: string; quantityToShip: number }[]; notes?: string }>({
            query: (data) => ({
                url: '/shipment/sale/create',
                method: 'POST',
                body: {
                    saleId: data.saleId,
                    productShipments: data.products.map(p => ({
                        saleProductId: p.saleProductId,
                        quantityToShip: p.quantityToShip
                    })),
                    notes: data.notes || ''
                }
            }),
            invalidatesTags: ['Orders', 'Sales']
        }),
        getCompletedAwaitingApproval: builder.query<ShipmentResponse[], void>({
            query: () => '/shipment/completed-awaiting',
            providesTags: ['Orders']
        }),
        getApprovedShipments: builder.query<ShipmentResponse[], void>({
            query: () => '/shipment/approved',
            providesTags: ['Orders']
        }),
        getOrderShipmentProgress: builder.query<{ totalProducts: number; shippedProducts: number; percentComplete: number; shipmentsCount: number; pendingShipments: number }, string>({
            query: (orderId) => `/shipment/progress/${orderId}`,
            providesTags: ['Orders']
        }),
        getSaleShipmentProgress: builder.query<{ totalProducts: number; shippedProducts: number; percentComplete: number; shipmentsCount: number; pendingShipments: number }, string>({
            query: (saleId) => `/shipment/progress/sale/${saleId}`,
            providesTags: ['Sales']
        }),
        updateDeliveryDetails: builder.mutation<void, { shipmentId: string; formData: FormData }>({
            query: ({ shipmentId, formData }) => ({
                url: `/shipment/${shipmentId}/delivery-details`,
                method: 'PATCH',
                body: formData
            }),
            invalidatesTags: ['Orders']
        }),
        // Admin/Manager shipment management endpoints
        cancelShipment: builder.mutation<void, string>({
            query: (shipmentId) => ({
                url: `/shipment/${shipmentId}/cancel`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Orders', 'Sales']
        }),
        updatePlannedDate: builder.mutation<void, { shipmentId: string; newDate: string }>({
            query: ({ shipmentId, newDate }) => ({
                url: `/shipment/${shipmentId}/planned-date`,
                method: 'PATCH',
                body: { newDate },
                headers: {
                    'Content-Type': 'application/json'
                }
            }),
            invalidatesTags: ['Orders', 'Sales']
        }),
        withdrawShipment: builder.mutation<void, string>({
            query: (shipmentId) => ({
                url: `/shipment/${shipmentId}/withdraw`,
                method: 'POST'
            }),
            invalidatesTags: ['Orders', 'Sales']
        }),
        updateShipmentVehicle: builder.mutation<void, { shipmentId: string; vehicleId: string }>({
            query: ({ shipmentId, vehicleId }) => ({
                url: `/shipment/${shipmentId}/vehicle`,
                method: 'PATCH',
                body: { vehicleId },
                headers: { 'Content-Type': 'application/json' }
            }),
            invalidatesTags: ['Orders', 'Sales']
        }),
        updateShipmentDriverById: builder.mutation<void, { shipmentId: string; driverId: string }>({
            query: ({ shipmentId, driverId }) => ({
                url: `/shipment/${shipmentId}/update-driver`,
                method: 'PATCH',
                body: { driverId },
                headers: { 'Content-Type': 'application/json' }
            }),
            invalidatesTags: ['Orders', 'Sales']
        }),
    })
})

export const {
    useApproveShipmentMutation,
    useApproveInitialShipmentMutation,
    useListPendingShipmentsQuery,
    useListAwaitingPlanningShipmentsQuery,
    useListReadyShipmentsQuery,
    useCreatePartialShipmentMutation,
    useCompleteShipmentMutation,
    useFinalizeShipmentMutation,
    useGetShipmentDetailsQuery,
    useGetShipmentDetailsByIdQuery,
    usePlanShipmentMutation,
    useUpdateShipmentDriverMutation,
    useListVehiclesQuery,
    useDownloadShipmentReportMutation,
    useDownloadShipmentReportByShipmentIdMutation,
    useDownloadSignedDocumentMutation,
    useCreateSaleShipmentMutation,
    useGetCompletedAwaitingApprovalQuery,
    useGetApprovedShipmentsQuery,
    useGetOrderShipmentProgressQuery,
    useGetSaleShipmentProgressQuery,
    useCancelShipmentMutation,
    useUpdatePlannedDateMutation,
    useWithdrawShipmentMutation,
    useUpdateShipmentVehicleMutation,
    useUpdateShipmentDriverByIdMutation
} = shipmentApi
