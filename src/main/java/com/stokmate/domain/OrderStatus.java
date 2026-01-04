package com.stokmate.domain;

public enum OrderStatus {
    // Initial states
    CREATED, // Oluşturuldu

    // Product acceptance phase
    PENDING_ACCEPTANCE, // Ürün kabulü bekliyor
    PARTIALLY_ACCEPTED, // Kısmen kabul edildi
    ACCEPTED, // Kabul edildi

    // Shipment approval phase
    PENDING_SHIPMENT_APPROVAL, // Sevk onayı bekliyor
    SHIPMENT_APPROVED, // Sevk onaylandı

    // Shipment phase
    IN_SHIPMENT, // Sevkiyatta
    PARTIALLY_SHIPPED, // Kısmen sevk edildi
    DELIVERED, // Teslim edildi

    // Problem handling
    PROBLEMATIC_DELIVERY, // Sorunlu teslimat
    SSH_ORDER_CREATED, // SSH alt sipariş oluşturuldu

    // Final states
    COMPLETED, // Tamamlandı
    CANCELLED, // İptal edildi

    // Legacy statuses (for backward compatibility)
    DEVAM_EDIYOR, // devam ediyor (deprecated)
    TAMAMLANDI, // tamamlandı (deprecated)
    IPTAL_EDILDI // iptal edildi (deprecated)
}
