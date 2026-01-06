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
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
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
            localStorage.setItem('token', action.payload.token)
            localStorage.setItem('user', JSON.stringify(action.payload.user))
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload
            localStorage.setItem('user', JSON.stringify(action.payload))
        },
    },
})

export const { setCredentials, logout, setUser } = authSlice.actions
export default authSlice.reducer
