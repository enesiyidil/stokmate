import { api } from './base.api'

interface LoginRequest {
    email: string
    password: string
}

interface OtpLoginRequest {
    email: string
    code: string
}

type UserRole = 'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'OPERATIONS_MANAGER' | 'LOGISTICS_MANAGER' | 'STORE_MANAGER' | 'STORE_EMPLOYEE'

interface AuthResponse {
    token: string
    requiresTwoFactor?: boolean
    requiresSetup?: boolean
    qrCodeImage?: string
    totpSecret?: string
    user?: {
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
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        loginWithOtp: builder.mutation<AuthResponse, OtpLoginRequest>({
            query: (credentials) => ({
                url: '/auth/login/otp',
                method: 'POST',
                body: credentials,
            }),
        }),
        verify2FA: builder.mutation<AuthResponse, { email: string; code: string }>({
            query: (body) => ({
                url: '/auth/verify-2fa',
                method: 'POST',
                body,
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

export const {
    useLoginMutation,
    useLoginWithOtpMutation,
    useVerify2FAMutation,
    useGetMeQuery,
    useLogoutMutation,
    useForgotPasswordMutation
} = authApi
