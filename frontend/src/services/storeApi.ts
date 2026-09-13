import { api } from '../api/base.api'

export interface StoreCreateRequest {
    code: string
    name: string
    address?: string
    phone?: string
    email?: string
    managerId?: string
}

export interface StoreUpdateRequest {
    name?: string
    address?: string
    phone?: string
    email?: string
    managerId?: string
    active?: boolean
}

export interface StoreResponse {
    id: string
    code: string
    name: string
    address?: string
    phone?: string
    email?: string
    active: boolean
    manager?: {
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        role: string
    }
    createdAt: string
    updatedAt: string
}

export const storeApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createStore: builder.mutation<StoreResponse, StoreCreateRequest>({
            query: (store) => ({
                url: '/stores',
                method: 'POST',
                body: store,
            }),
            invalidatesTags: ['Stores'],
        }),
        updateStore: builder.mutation<StoreResponse, { id: string; data: StoreUpdateRequest }>({
            query: ({ id, data }) => ({
                url: `/stores/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Stores'],
        }),
        listStores: builder.query<StoreResponse[], { activeOnly?: boolean }>({
            query: ({ activeOnly }) => ({
                url: '/stores',
                params: activeOnly !== undefined ? { activeOnly } : {},
            }),
            providesTags: ['Stores'],
        }),
        getStoreById: builder.query<StoreResponse, string>({
            query: (id) => `/stores/${id}`,
            providesTags: ['Stores'],
        }),
        deleteStore: builder.mutation<void, string>({
            query: (id) => ({
                url: `/stores/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Stores'],
        }),
    }),
})

export const {
    useCreateStoreMutation,
    useUpdateStoreMutation,
    useListStoresQuery,
    useGetStoreByIdQuery,
    useDeleteStoreMutation,
} = storeApi
