import { useSelector } from 'react-redux';
import { Permissions } from '../utils/permissions';
import type { RootState } from '../store';

/**
 * Custom hook for checking user permissions based on role
 */
export const usePermissions = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const role = user?.role || '';

    return {
        // User management
        canManageUsers: Permissions.canManageUsers(role),

        // Product management
        canManageProducts: Permissions.canManageProducts(role),
        canViewProducts: Permissions.canViewProducts(role),

        // Shipment management
        canManageShipments: Permissions.canManageShipments(role),
        canApproveShipments: Permissions.canApproveShipments(role),
        canViewShipments: Permissions.canViewShipments(role),

        // Sales management
        canManageSales: Permissions.canManageSales(role),
        canDeleteSales: Permissions.canDeleteSales(role),

        // Vehicle access
        canAccessVehicles: Permissions.canAccessVehicles(role),

        // Order management
        canCancelOrders: Permissions.canCancelOrders(role),

        // Store/Customer management
        canManageStores: Permissions.canManageStores(role),
        canManageCustomers: Permissions.canManageCustomers(role),

        // Delete operations
        canDeleteDirect: Permissions.canDeleteDirect(role),
        requiresApproval: Permissions.requiresApproval(role),

        // Page access
        canAccessUsersPage: Permissions.canAccessUsersPage(role),
        canAccessEventsPage: Permissions.canAccessEventsPage(role),
        canApproveActions: Permissions.canApproveActions(role),

        // Current role
        role,
        user
    };
};
