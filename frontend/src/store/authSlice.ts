import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Role values must match backend Role.java enum exactly
type UserRole = 'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'STORE_MANAGER' | 'STORE_EMPLOYEE' | 'OPERATIONS_MANAGER' | 'LOGISTICS_MANAGER'

interface User {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: UserRole
    active: boolean
    totpEnabled?: boolean
    deleted?: boolean
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    sessionExpired: boolean
}

const loadUserFromStorage = (): User | null => {
    try {
        const userStr = localStorage.getItem('user')
        return userStr ? JSON.parse(userStr) : null
    } catch {
        return null
    }
}

const initialState: AuthState = {
    user: loadUserFromStorage(),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    sessionExpired: false,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.isAuthenticated = true
            state.sessionExpired = false
            localStorage.setItem('token', action.payload.token)
            localStorage.setItem('user', JSON.stringify(action.payload.user))
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.sessionExpired = false
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload
            localStorage.setItem('user', JSON.stringify(action.payload))
        },
        setSessionExpired: (state, action: PayloadAction<boolean>) => {
            state.sessionExpired = action.payload
        },
        refreshToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload
            state.sessionExpired = false
            localStorage.setItem('token', action.payload)
        },
    },
})

export const { setCredentials, logout, setUser, setSessionExpired, refreshToken } = authSlice.actions
export default authSlice.reducer

