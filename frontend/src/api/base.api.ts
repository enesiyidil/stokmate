import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:9090/api',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token
        if (token) {
            headers.set('authorization', `Bearer ${token}`)
        }
        return headers
    },
})

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: ['Auth', 'Product', 'Store', 'User', 'Order', 'Orders', 'OrderReceipt', 'Sales', 'Requests', 'Users', 'OrderReceipts', 'Stores', 'StoreEmployees', 'ProductAcceptances', 'Vehicles'],
    endpoints: () => ({}),
})

export const api = baseApi
