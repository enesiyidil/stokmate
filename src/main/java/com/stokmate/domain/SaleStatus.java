package com.stokmate.domain;

public enum SaleStatus {
    DEVAM_EDIYOR, // Ongoing - default state
    PENDING_SHIPMENT_APPROVAL, // Sevk onayı bekliyor
    SHIPMENT_APPROVED, // Sevk onaylandı
    IN_SHIPMENT, // Sevkiyatta
    PARTIALLY_SHIPPED, // Kısmen sevk edildi
    DELIVERED, // Teslim edildi
    TAMAMLANDI, // Completed
    IPTAL_EDILDI // Cancelled
}
