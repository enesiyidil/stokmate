import { api } from '../api/base.api'

export interface StoreEmployeeRequest {
    userId: string
    joinDate: string  // ISO date string
}

export interface StoreEmployeeResponse {
    id: string
    user: {
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        phone: string | null
        role: string
    }
    joinDate: string
    active: boolean
}

export const storeEmployeeApi = api.injectEndpoints({
    endpoints: (builder) => ({
        assignEmployee: builder.mutation<StoreEmployeeResponse, { storeId: string; data: StoreEmployeeRequest }>({
            query: ({ storeId, data }) => ({
                url: `/stores/${storeId}/employees`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Stores', 'StoreEmployees'],
        }),
        removeEmployee: builder.mutation<void, { storeId: string; userId: string }>({
            query: ({ storeId, userId }) => ({
                url: `/stores/${storeId}/employees/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Stores', 'StoreEmployees'],
        }),
        getStoreEmployees: builder.query<StoreEmployeeResponse[], string>({
            query: (storeId) => `/stores/${storeId}/employees`,
            providesTags: ['StoreEmployees'],
        }),
    }),
})

export const {
    useAssignEmployeeMutation,
    useRemoveEmployeeMutation,
    useGetStoreEmployeesQuery,
} = storeEmployeeApi
