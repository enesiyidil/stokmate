import { api } from '../api/base.api'

export interface UserResponse {
    id: string
    email: string
    role: string
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
    active: boolean
    deleted?: boolean
    deletedAlias?: string
    displayName?: string
    totpEnabled?: boolean
}

export interface UserSummaryResponse {
    id: string
    firstName: string
    lastName: string
    role: string
    displayName: string
}

export interface CreateUserRequest {
    email: string
    role: string
}

export interface UpdateProfileRequest {
    firstName: string
    lastName: string
    phone?: string
    address?: string
    password: string
}

export interface UpdateUserRoleRequest {
    role: string
}

export interface ToggleUserActiveRequest {
    active: boolean
}

export interface DeleteUserWithAliasRequest {
    alias: string
}

export const userApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getUserProfile: builder.query<UserResponse, void>({
            query: () => '/users/me',
            providesTags: ['Auth'],
        }),
        getAllUsers: builder.query<UserResponse[], void>({
            query: () => '/users',
            providesTags: ['Users'],
        }),
        getUserSummaries: builder.query<UserSummaryResponse[], void>({
            query: () => '/users/summary',
            providesTags: ['Users'],
        }),
        createUser: builder.mutation<UserResponse, CreateUserRequest>({
            query: (data) => ({
                url: '/users',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        updateProfile: builder.mutation<UserResponse, UpdateProfileRequest>({
            query: (data) => ({
                url: '/users/profile',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Auth', 'Users'],
        }),
        deleteUser: builder.mutation<void, string>({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
        updateUserRole: builder.mutation<UserResponse, { id: string; role: string }>({
            query: ({ id, role }) => ({
                url: `/users/${id}/role`,
                method: 'PUT',
                body: { role },
            }),
            invalidatesTags: ['Users'],
        }),
        toggleUserActive: builder.mutation<UserResponse, { id: string; active: boolean }>({
            query: ({ id, active }) => ({
                url: `/users/${id}/toggle-active`,
                method: 'PUT',
                body: { active },
            }),
            invalidatesTags: ['Users'],
        }),
        softDeleteUser: builder.mutation<void, { id: string; alias: string }>({
            query: ({ id, alias }) => ({
                url: `/users/${id}/soft`,
                method: 'DELETE',
                body: { alias },
            }),
            invalidatesTags: ['Users'],
        }),
        getSalesConsultants: builder.query<UserResponse[], void>({
            query: () => '/users/sales-consultants',
            providesTags: ['Users'],
        }),
        toggle2FA: builder.mutation<{ enabled: boolean; secret?: string; qrCodeUrl?: string }, void>({
            query: () => ({
                url: '/2fa/toggle',
                method: 'POST',
            }),
            invalidatesTags: ['Users'],
        }),
        // New verification endpoint for client-side gating
        verifyGate2FA: builder.mutation<boolean, string>({
            query: (code) => ({
                url: '/2fa/verify-code',
                method: 'POST',
                body: { code },
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
        }),
        // Change password mutation
        changePassword: builder.mutation<boolean, { oldPassword: string; newPassword: string; totpCode?: string }>({
            query: (data) => ({
                url: '/auth/me/password',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Auth'],
        }),
    }),
})

export const {
    useGetUserProfileQuery,
    useGetAllUsersQuery,
    useGetUserSummariesQuery,
    useCreateUserMutation,
    useUpdateProfileMutation,
    useDeleteUserMutation,
    useUpdateUserRoleMutation,
    useToggleUserActiveMutation,
    useSoftDeleteUserMutation,
    useGetSalesConsultantsQuery,
    useToggle2FAMutation,
    useVerifyGate2FAMutation,
    useChangePasswordMutation,
} = userApi
