import { api } from '../api/base.api'

export interface BalancePaymentResponse {
    id: string
    amount: number
    paidByFirstName: string
    paidByLastName: string
    paidByEmail: string
    nextDueDate?: string
    notes?: string
    createdAt: string
}

export interface BalanceLedgerResponse {
    id: string
    customerId: string
    customerFirstName: string
    customerLastName: string
    contractType: string
    contractId: string
    contractNo: string
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    dueDate: string
    status: string
    notes?: string
    payments: BalancePaymentResponse[]
    createdAt: string
    createdBy?: string
}

export interface BalanceLedgerRequest {
    customerId: string
    contractType: string
    contractId: string
    paidAmount: number
    dueDate: string
    notes?: string
}

export interface BalancePaymentRequest {
    amount: number
    nextDueDate?: string
    notes?: string
}

export interface BalanceLedgerUpdateRequest {
    notes?: string
    totalAmount?: number
    dueDate?: string
}

export interface ContractOption {
    id: string
    contractNo: string
    type: string
    label: string
    totalAmount: number
}

export const balanceLedgerApi = api.injectEndpoints({
    endpoints: (builder) => ({
        listBalanceLedger: builder.query<import('../types/common').PageResponse<BalanceLedgerResponse>, {
            page?: number; size?: number;
            search?: string
            status?: string
            dueDateFrom?: string
            dueDateTo?: string
        }>({
            query: (params) => ({
                url: '/balance-ledger',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 50,
                    ...(params.search && { search: params.search }),
                    ...(params.status && { status: params.status }),
                    ...(params.dueDateFrom && { dueDateFrom: params.dueDateFrom }),
                    ...(params.dueDateTo && { dueDateTo: params.dueDateTo }),
                }
            }),
            providesTags: ['BalanceLedger'],
        }),
        getBalanceLedger: builder.query<BalanceLedgerResponse, string>({
            query: (id) => `/balance-ledger/${id}`,
            providesTags: ['BalanceLedger'],
        }),
        createBalanceLedger: builder.mutation<BalanceLedgerResponse, BalanceLedgerRequest>({
            query: (data) => ({
                url: '/balance-ledger',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['BalanceLedger'],
        }),
        addBalancePayment: builder.mutation<BalanceLedgerResponse, { id: string; data: BalancePaymentRequest }>({
            query: ({ id, data }) => ({
                url: `/balance-ledger/${id}/payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['BalanceLedger'],
        }),
        updateBalanceLedger: builder.mutation<BalanceLedgerResponse, { id: string; data: BalanceLedgerUpdateRequest }>({
            query: ({ id, data }) => ({
                url: `/balance-ledger/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['BalanceLedger'],
        }),
        deleteBalanceLedger: builder.mutation<void, string>({
            query: (id) => ({
                url: `/balance-ledger/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['BalanceLedger'],
        }),
        getContractsByCustomer: builder.query<ContractOption[], string>({
            query: (customerId) => `/balance-ledger/contracts/${customerId}`,
        }),
    }),
})

export const {
    useListBalanceLedgerQuery,
    useGetBalanceLedgerQuery,
    useCreateBalanceLedgerMutation,
    useAddBalancePaymentMutation,
    useUpdateBalanceLedgerMutation,
    useDeleteBalanceLedgerMutation,
    useGetContractsByCustomerQuery,
} = balanceLedgerApi
