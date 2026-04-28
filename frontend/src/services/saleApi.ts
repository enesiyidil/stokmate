
import { baseApi } from '../api/base.api';


export const SaleStatus = {
    DEVAM_EDIYOR: 'DEVAM_EDIYOR',
    TAMAMLANDI: 'TAMAMLANDI',
    IPTAL_EDILDI: 'IPTAL_EDILDI'
} as const;

export type SaleStatus = typeof SaleStatus[keyof typeof SaleStatus];

export interface SaleProductRequest {
    productId: string;
    quantity: number;
    unitPriceExcludingVat: number;
    vatRate: number;
    internetSalesPrice: number;
}

export interface SaleRequest {
    saleNo?: string;
    customerId: string;
    salesConsultantId?: string;
    contractNo?: string;
    saleDate?: string; // YYYY-MM-DD
    status?: SaleStatus;
    notes?: string;
    products: SaleProductRequest[];
}

export interface SaleProductResponse {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    productImageUrl?: string;
    brand?: string;
    quantity: number;
    unitPriceExcludingVat: number;
    vatRate: number;
    internetSalesPrice: number;
    totalPrice: number;
    pendingShipmentQuantity?: number;
    shippedQuantity?: number;
    deliveredQuantity?: number;
}

export interface SaleResponse {
    id: string;
    saleNo: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    salesConsultantId: string;
    salesConsultantName: string;
    contractNo?: string;
    contractFileKey?: string;
    contractDownloadUrl?: string;
    saleDate: string;
    status: SaleStatus;
    notes?: string;
    products: SaleProductResponse[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}

export interface SaleEventResponse {
    id: string;
    eventType: string;
    description: string;
    createdByName: string;
    createdAt: string;
}

export const saleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSales: builder.query<import('../types/common').PageResponse<SaleResponse>, {
            page?: number; size?: number; search?: string;
            statusGroup?: string; consultantId?: string
        }>({
            query: (params) => ({
                url: '/sales',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 50,
                    ...(params.search && { search: params.search }),
                    ...(params.statusGroup && { statusGroup: params.statusGroup }),
                    ...(params.consultantId && { consultantId: params.consultantId }),
                }
            }),
            providesTags: ['Sales']
        }),

        getSale: builder.query<SaleResponse, string>({
            query: (id) => `/sales/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Sales', id }]
        }),

        createSale: builder.mutation<SaleResponse, SaleRequest>({
            query: (data) => ({
                url: '/sales',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Sales']
        }),

        updateStatus: builder.mutation<SaleResponse, { id: string; status: SaleStatus }>({
            query: ({ id, status }) => ({
                url: `/sales/${id}/status`,
                method: 'PUT',
                params: { status }
            }),
            invalidatesTags: (_result, _error, { id }) => ['Sales', { type: 'Sales', id }]
        }),

        uploadContract: builder.mutation<SaleResponse, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: `/sales/${id}/contract`,
                    method: 'POST',
                    body: formData
                };
            },
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Sales', id }]
        }),

        deleteContract: builder.mutation<void, string>({
            query: (id) => ({
                url: `/sales/${id}/contract`,
                method: 'DELETE'
            }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Sales', id }]
        }),

        getSaleEvents: builder.query<SaleEventResponse[], string>({
            query: (id) => `/sales/${id}/events`,
            providesTags: (_result, _error, id) => [{ type: 'Sales', id }]
        })
    })
});

export const {
    useGetSalesQuery,
    useGetSaleQuery,
    useCreateSaleMutation,
    useUpdateStatusMutation,
    useUploadContractMutation,
    useDeleteContractMutation,
    useGetSaleEventsQuery
} = saleApi;
