package com.stokmate.domain;

public enum ShipmentStatus {
    PENDING, // Sevk oluşturuldu, ilk onay bekliyor
    APPROVED, // İlk onay verildi, planlama bekliyor
    PLANNED, // Planlandı, sevke hazır
    COMPLETED, // Teslimat yapıldı, son onay bekliyor
    FINALIZED // Son onay verildi, tamamlandı
}
