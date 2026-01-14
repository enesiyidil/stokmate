import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token
        if (token) headers.set('authorization', `Bearer ${token}`)
        return headers
    },
})

const baseQueryWithAccessDeniedHandler: typeof rawBaseQuery = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions)

    if (result.error && result.error.status === 403) {
        window.dispatchEvent(new CustomEvent('access-denied', {
            detail: { message: 'Bu işlem için yetkiniz bulunmamaktadır' }
        }))
    }
    return result
}

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithAccessDeniedHandler,
    tagTypes: ['Auth', 'Product', 'Store', 'User', 'Order', 'Orders', 'OrderReceipt', 'Sales', 'Requests', 'Users', 'OrderReceipts', 'Stores', 'StoreEmployees', 'ProductAcceptances', 'Vehicles', 'Notifications'],
    endpoints: () => ({}),
})

export const api = baseApi
