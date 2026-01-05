import { Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../hooks/useAuth'
import { useGetMeQuery } from '../api/auth.api'
import { setUser } from '../store/authSlice'

interface ProtectedRouteProps {
    allowedRoles?: Array<'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'OPERATIONS_MANAGER' | 'LOGISTICS_MANAGER' | 'STORE_MANAGER' | 'STORE_EMPLOYEE'>
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user, token } = useAppSelector((state) => state.auth)
    const dispatch = useAppDispatch()

    // Fetch user data if we have a token but no user (e.g., after page refresh)
    const { data: meData, isLoading } = useGetMeQuery(undefined, {
        skip: !token || !!user, // Skip if no token or user already exists
    })

    // Update user in state when data is fetched
    useEffect(() => {
        if (meData && !user) {
            dispatch(setUser({
                id: meData.id,
                email: meData.email,
                firstName: meData.firstName,
                lastName: meData.lastName,
                role: meData.role,
                active: meData.active,
            }))
        }
    }, [meData, user, dispatch])

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Show loading while fetching user data
    if (token && !user && isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-lg">Yükleniyor...</div>
            </div>
        )
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />
}
