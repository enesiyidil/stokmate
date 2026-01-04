// Utility function to check if user can see prices
export const canSeePrices = (role: string | undefined): boolean => {
    if (!role) return false
    return role === 'ADMIN' || role === 'MANAGER'
}

// Utility function to check if user can manage users  
export const canManageUsers = (role: string | undefined): boolean => {
    if (!role) return false
    return role === 'ADMIN'
}
