package com.stokmate.domain;

public enum OrderStatus {
    // Main statuses (new simplified system)
    IN_PROGRESS, // Devam Ediyor - Sipariş aktif, tamamlanmamış
    COMPLETED, // Tamamlandı - Tüm ürünler sevk edildi
    CANCELLED, // İptal Edildi - Sipariş iptal edildi

    // Legacy statuses (backward compatibility - mapped to main statuses)
    CREATED, // -> IN_PROGRESS
    PENDING_ACCEPTANCE, // -> IN_PROGRESS
    PARTIALLY_ACCEPTED, // -> IN_PROGRESS
    ACCEPTED, // -> IN_PROGRESS
    PENDING_SHIPMENT_APPROVAL, // -> IN_PROGRESS
    SHIPMENT_APPROVED, // -> IN_PROGRESS
    IN_SHIPMENT, // -> IN_PROGRESS
    PARTIALLY_SHIPPED, // -> IN_PROGRESS
    DELIVERED, // -> COMPLETED
    PROBLEMATIC_DELIVERY, // -> IN_PROGRESS
    SSH_ORDER_CREATED, // -> IN_PROGRESS
    DEVAM_EDIYOR, // -> IN_PROGRESS (legacy Turkish)
    TAMAMLANDI, // -> COMPLETED (legacy Turkish)
    IPTAL_EDILDI; // -> CANCELLED (legacy Turkish)

    /**
     * Get the simplified status for display
     */
    public OrderStatus getSimplifiedStatus() {
        return switch (this) {
            case COMPLETED, DELIVERED, TAMAMLANDI -> COMPLETED;
            case CANCELLED, IPTAL_EDILDI -> CANCELLED;
            default -> IN_PROGRESS;
        };
    }

    /**
     * Get display name in Turkish
     */
    public String getDisplayName() {
        return switch (this.getSimplifiedStatus()) {
            case COMPLETED -> "Tamamlandı";
            case CANCELLED -> "İptal Edildi";
            default -> "Devam Ediyor";
        };
    }

    /**
     * Check if order is still active (not completed or cancelled)
     */
    public boolean isActive() {
        return this.getSimplifiedStatus() == IN_PROGRESS;
    }
}
