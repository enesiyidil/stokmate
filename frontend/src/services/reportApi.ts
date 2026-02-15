import { baseApi } from '../api/base.api';

// Types
export interface ReportResponse {
    id: string;
    reportNo: string;
    reportType: string;
    status: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    filters?: string;
    totalRecords: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    createdByName: string;
    createdByEmail: string;
    createdAt: string;
    completedAt?: string;
    pdfFileKey?: string;
}

export interface GenerateOrderReportRequest {
    startDate: string;
    endDate: string;
    salesConsultantIds?: string[];
    brands?: string[];
    title?: string;
}

export interface GenerateStockSaleReportRequest {
    startDate: string;
    endDate: string;
    salesConsultantIds?: string[];
    brands?: string[];
    title?: string;
}

export interface GenerateShipmentReportRequest {
    startDate: string;
    endDate: string;
    shipmentScope?: string;
    title?: string;
}

export const reportApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        listReports: builder.query<ReportResponse[], { type?: string }>({
            query: (params) => ({
                url: '/reports',
                params
            }),
            providesTags: ['Reports']
        }),

        getReport: builder.query<ReportResponse, string>({
            query: (id) => `/reports/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Reports', id }]
        }),

        generateOrderReport: builder.mutation<ReportResponse, GenerateOrderReportRequest>({
            query: (data) => ({
                url: '/reports/order',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Reports']
        }),

        generateStockSaleReport: builder.mutation<ReportResponse, GenerateStockSaleReportRequest>({
            query: (data) => ({
                url: '/reports/stock-sale',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Reports']
        }),

        generateShipmentReport: builder.mutation<ReportResponse, GenerateShipmentReportRequest>({
            query: (data) => ({
                url: '/reports/shipment',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Reports']
        }),

        deleteReport: builder.mutation<void, string>({
            query: (id) => ({
                url: `/reports/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Reports']
        })
    })
});

export const {
    useListReportsQuery,
    useGetReportQuery,
    useGenerateOrderReportMutation,
    useGenerateStockSaleReportMutation,
    useGenerateShipmentReportMutation,
    useDeleteReportMutation
} = reportApi;
