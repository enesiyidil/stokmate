
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
    quantity: number;
    unitPriceExcludingVat: number;
    vatRate: number;
    internetSalesPrice: number;
    totalPrice: number;
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
        getSales: builder.query<SaleResponse[], { status?: SaleStatus; consultantId?: string }>({
            query: (params) => ({
                url: '/sales',
                params
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
