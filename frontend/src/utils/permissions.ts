import { Role } from '../constants/roles';

// Permission checking utilities based on role
export const Permissions = {
    // User management - only MANAGER and ADMIN
    canManageUsers: (role: string): boolean => {
        return role === Role.ADMIN || role === Role.MANAGER;
    },

    // Product management - OPERATIONS_MANAGER and above
    canManageProducts: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR, Role.OPERATIONS_MANAGER].includes(role as Role);
    },

    // Shipment planning/completion - LOGISTICS_MANAGER and above
    canManageShipments: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR, Role.LOGISTICS_MANAGER].includes(role as Role);
    },

    // Shipment approval - DIRECTOR and above
    canApproveShipments: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR].includes(role as Role);
    },

    // Sales management - STORE roles and above
    canManageSales: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR, Role.STORE_MANAGER, Role.STORE_EMPLOYEE].includes(role as Role);
    },

    // Delete sales - DIRECTOR and above
    canDeleteSales: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR].includes(role as Role);
    },

    // Vehicle access - OPERATIONS_MANAGER, LOGISTICS_MANAGER and above
    canAccessVehicles: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR, Role.OPERATIONS_MANAGER, Role.LOGISTICS_MANAGER].includes(role as Role);
    },

    // Order cancellation - DIRECTOR and above
    canCancelOrders: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR].includes(role as Role);
    },

    // Store/Customer management
    canManageStores: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR].includes(role as Role);
    },

    canManageCustomers: (role: string): boolean => {
        return [Role.ADMIN, Role.MANAGER, Role.DIRECTOR, Role.STORE_MANAGER, Role.STORE_EMPLOYEE].includes(role as Role);
    },

    // Delete operations (creates pending action for DIRECTOR)
    canDeleteDirect: (role: string): boolean => {
        return role === Role.ADMIN || role === Role.MANAGER;
    },

    requiresApproval: (role: string): boolean => {
        return role === Role.DIRECTOR;
    },

    // View-only permissions
    canViewProducts: (role: string): boolean => {
        return true; // All authenticated users
    },

    canViewShipments: (role: string): boolean => {
        return true; // All authenticated users
    },

    // Page access permissions
    canAccessUsersPage: (role: string): boolean => {
        return role === Role.ADMIN || role === Role.MANAGER;
    },

    canAccessEventsPage: (role: string): boolean => {
        return role === Role.ADMIN || role === Role.MANAGER;
    },

    canApproveActions: (role: string): boolean => {
        return role === Role.ADMIN; // Only ADMIN can approve pending actions
    }
};
