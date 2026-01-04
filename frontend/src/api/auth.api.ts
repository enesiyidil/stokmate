import { api } from './base.api'

interface LoginRequest {
    email: string
    password: string
}

interface OtpLoginRequest {
    email: string
    code: string
}

type UserRole = 'ADMIN' | 'MUDUR' | 'DEPO_SORUMLU' | 'DEPO_CALISAN' | 'MAGAZA_SORUMLU' | 'MAGAZA_CALISAN'

interface LoginResponse {
    token: string
    user: {
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        role: UserRole
        active: boolean
    }
}

interface MeResponse {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: UserRole
    active: boolean
    phone: string | null
    address: string | null
}

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        loginWithOtp: builder.mutation<LoginResponse, OtpLoginRequest>({
            query: (credentials) => ({
                url: '/auth/login/otp',
                method: 'POST',
                body: credentials,
            }),
        }),
        forgotPassword: builder.mutation<boolean, { email: string }>({
            query: (data) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data
            })
        }),
        getMe: builder.query<MeResponse, void>({
            query: () => '/auth/me',
            providesTags: ['Auth'],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
    }),
})

export const { useLoginMutation, useLoginWithOtpMutation, useGetMeQuery, useLogoutMutation, useForgotPasswordMutation } = authApi
