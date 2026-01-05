import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: keyof ReturnType<typeof usePermissions>;
    requireAny?: Array<keyof ReturnType<typeof usePermissions>>;
    redirectTo?: string;
}

/**
 * Component to protect routes based on user permissions
 * Shows "Yetkisiz Erişim" message and redirects if user lacks permission
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermission,
    requireAny,
    redirectTo = '/'
}) => {
    const permissions = usePermissions();

    // Check if user has required permission
    let hasPermission = true;

    if (requiredPermission) {
        hasPermission = Boolean(permissions[requiredPermission]);
    } else if (requireAny && requireAny.length > 0) {
        hasPermission = requireAny.some(perm => Boolean(permissions[perm]));
    }

    if (!hasPermission) {
        // Show unauthorized message briefly before redirect
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-16 w-16 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h2>
                    <p className="text-gray-600 mb-4">
                        Bu sayfaya erişim yetkiniz bulunmamaktadır.
                    </p>
                    <Navigate to={redirectTo} replace />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
