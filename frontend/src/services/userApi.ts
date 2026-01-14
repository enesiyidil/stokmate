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
        toggle2FA: builder.mutation<UserResponse, { id: string; enabled: boolean }>({
            query: ({ id, enabled }) => ({
                url: `/users/${id}/toggle-2fa`,
                method: 'PUT',
                body: { enabled },
            }),
            invalidatesTags: ['Users'],
        }),
    }),
})

export const {
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
} = userApi
