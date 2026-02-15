import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'
import { setSessionExpired } from '../store/authSlice'

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
    // Check if session is expired before making request - skip if so (except for reauth endpoint)
    const state = api.getState() as RootState
    if (state.auth.sessionExpired) {
        const argUrl = typeof args === 'string' ? args : args.url
        if (!argUrl?.includes('/auth/reauth')) {
            return {
                error: {
                    status: 'CUSTOM_ERROR' as const,
                    error: 'TOKEN_EXPIRED',
                    data: { error: 'TOKEN_EXPIRED', message: 'Oturumunuz sona erdi' }
                }
            } as any
        }
    }

    const result = await rawBaseQuery(args, api, extraOptions)

    // Handle token expiration - detect TOKEN_EXPIRED error from backend
    if (result.error && result.error.status === 401) {
        const errorData = result.error.data as { error?: string; message?: string } | undefined
        if (errorData?.error === 'TOKEN_EXPIRED') {
            api.dispatch(setSessionExpired(true))
            return {
                error: {
                    status: 'TOKEN_EXPIRED',
                    data: errorData
                }
            }
        }
    }

    // Handle access denied (403)
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
    tagTypes: ['Auth', 'Product', 'Store', 'User', 'Order', 'Orders', 'OrderReceipt', 'Sales', 'Requests', 'Users', 'OrderReceipts', 'Stores', 'StoreEmployees', 'ProductAcceptances', 'Vehicles', 'Notifications', 'Announcement', 'Reports'],
    endpoints: () => ({}),
})

export const api = baseApi

