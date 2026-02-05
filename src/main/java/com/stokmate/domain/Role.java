package com.stokmate.domain;

public enum Role {
    ADMIN,
    MANAGER, // UI displays as "Craft"
    DIRECTOR,
    STORE_MANAGER,
    STORE_EMPLOYEE,
    OPERATIONS_MANAGER,
    LOGISTICS_MANAGER;

    /**
     * Get display name for the role
     * 
     * @return Localized display name for Turkish UI
     */
    public String getDisplayName() {
        return switch (this) {
            case ADMIN -> "Admin";
            case MANAGER -> "Craft";
            case DIRECTOR -> "Direktör";
            case STORE_MANAGER -> "Mağaza Sorumlusu";
            case STORE_EMPLOYEE -> "Mağaza Çalışanı";
            case OPERATIONS_MANAGER -> "Operasyon Sorumlusu";
            case LOGISTICS_MANAGER -> "Lojistik Sorumlusu";
        };
    }

    /**
     * Check if this role has permission to delete users
     */
    public boolean canDeleteUsers() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role requires approval for delete operations
     */
    public boolean requiresDeleteApproval() {
        return this == DIRECTOR;
    }

    /**
     * Check if this role can approve delete operations
     */
    public boolean canApproveDeletes() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role can create/edit/delete products
     */
    public boolean canManageProducts() {
        return this == OPERATIONS_MANAGER || this == DIRECTOR || this == MANAGER || this == ADMIN;
    }

    /**
     * Check if this role can manage shipments (plan/complete)
     */
    public boolean canManageShipments() {
        return this == LOGISTICS_MANAGER || this == DIRECTOR || this == MANAGER || this == ADMIN;
    }

    /**
     * Check if this role can approve shipments
     */
    public boolean canApproveShipments() {
        return this == DIRECTOR || this == MANAGER || this == ADMIN;
    }

    /**
     * Check if this role can manage sales
     */
    public boolean canManageSales() {
        return this == STORE_MANAGER || this == STORE_EMPLOYEE || this == DIRECTOR || this == MANAGER || this == ADMIN;
    }

    /**
     * Check if this role can delete sales
     */
    public boolean canDeleteSales() {
        return this == DIRECTOR || this == MANAGER || this == ADMIN;
    }

    /**
     * Check if this role can access vehicle management
     */
    public boolean canAccessVehicles() {
        return this == OPERATIONS_MANAGER || this == LOGISTICS_MANAGER || this == DIRECTOR || this == MANAGER
                || this == ADMIN;
    }

    /**
     * Check if this role can cancel orders
     */
    public boolean canCancelOrders() {
        return this == DIRECTOR || this == MANAGER || this == ADMIN;
    }

    /**
     * Check if this role can modify approved shipments (date change, withdraw,
     * cancel)
     */
    public boolean canModifyApprovedShipments() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role can delete product acceptances
     */
    public boolean canDeleteProductAcceptances() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role can fully edit orders (all fields)
     */
    public boolean canFullyEditOrders() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role can delete orders
     */
    public boolean canDeleteOrders() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role can set past dates for shipment planning
     */
    public boolean canSetPastShipmentDates() {
        return this == ADMIN || this == MANAGER;
    }

    /**
     * Check if this role can submit products for shipment (Sevke Sun)
     */
    public boolean canSubmitForShipment() {
        return this == STORE_MANAGER || this == STORE_EMPLOYEE || this == OPERATIONS_MANAGER
                || this == DIRECTOR || this == MANAGER || this == ADMIN;
    }
}
