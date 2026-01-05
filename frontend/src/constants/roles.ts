// Role display name mapping
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Craft', // Database: MANAGER, UI: Craft
    DIRECTOR: 'Direktör',
    STORE_MANAGER: 'Mağaza Sorumlusu',
    STORE_EMPLOYEE: 'Mağaza Çalışanı',
    OPERATIONS_MANAGER: 'Operasyon Sorumlusu',
    LOGISTICS_MANAGER: 'Lojistik Sorumlusu'
};

// Get display name for a role
export const getRoleDisplayName = (role: string): string => {
    return ROLE_DISPLAY_NAMES[role] || role;
};

// Role hierarchy for permission checking
export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    DIRECTOR = 'DIRECTOR',
    OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
    LOGISTICS_MANAGER = 'LOGISTICS_MANAGER',
    STORE_MANAGER = 'STORE_MANAGER',
    STORE_EMPLOYEE = 'STORE_EMPLOYEE'
}
