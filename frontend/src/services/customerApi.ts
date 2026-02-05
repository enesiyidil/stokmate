import { api } from '../api/base.api'

export interface CustomerRequest {
    firstName: string
    lastName: string
    phone?: string
    alternatePhone?: string  // Yedek telefon numarası
    email?: string
    tcNo?: string
    city?: string
    district?: string
    neighborhood?: string
    fullAddress?: string
}

export interface CustomerResponse {
    id: string
    firstName: string
    lastName: string
    phone?: string
    alternatePhone?: string  // Yedek telefon numarası
    email?: string
    tcNo?: string
    city?: string
    district?: string
    neighborhood?: string
    fullAddress?: string
}

export const customerApi = api.injectEndpoints({
    endpoints: (builder) => ({
        listCustomers: builder.query<CustomerResponse[], void>({
            query: () => '/customers?size=1000', // Get all customers
            transformResponse: (response: any) => {
                // Backend returns Page<CustomerResponse>, extract content array
                return response.content || []
            },
            providesTags: ['Customers'],
        }),
        searchCustomers: builder.query<CustomerResponse[], string>({
            query: (query) => `/customers/search?query=${encodeURIComponent(query)}`,
            providesTags: ['Customers'],
        }),
        createCustomer: builder.mutation<CustomerResponse, CustomerRequest>({
            query: (customer) => ({
                url: '/customers',
                method: 'POST',
                body: customer,
            }),
            invalidatesTags: ['Customers'],
        }),
        updateCustomer: builder.mutation<CustomerResponse, { id: string; data: CustomerRequest }>({
            query: ({ id, data }) => ({
                url: `/customers/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Customers', 'Orders'], // Also invalidate orders since they contain customer info
        }),
        deleteCustomer: builder.mutation<void, string>({
            query: (id) => ({
                url: `/customers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Customers'],
        }),
    }),
})

export const {
    useListCustomersQuery,
    useSearchCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation
} = customerApi
