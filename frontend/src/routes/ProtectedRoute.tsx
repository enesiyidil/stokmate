import { Navigate, Outlet, useLocation } from 'react-router-dom'
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
    const location = useLocation()

    // Mobile Restriction Check
    const isMobile = window.innerWidth < 768
    const isDeliveryPage = location.pathname.startsWith('/delivery-confirm')

    if (isMobile && !isDeliveryPage) {
        return (
            <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 w-8 h-8"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Masaüstü Erişimi Gerekli</h1>
                <p className="text-stone-400 max-w-xs">
                    Bu panele sadece masaüstü veya geniş ekranlı cihazlardan erişebilirsiniz. Mobilden sadece teslimat işlemleri yapılabilir.
                </p>
            </div>
        )
    }

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
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
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
