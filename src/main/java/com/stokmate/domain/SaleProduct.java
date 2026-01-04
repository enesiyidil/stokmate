package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * SaleProduct represents individual products within a sale
 */
@Entity
@Table(name = "sale_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleProduct extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal shippedQuantity = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPriceExcludingVat; // KDV'siz birim fiyat (manual entry)

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate; // KDV oranı

    @Column(precision = 19, scale = 2)
    private BigDecimal internetSalesPrice; // Referans için internet satış fiyatı

    /**
     * Calculate remaining quantity to be shipped
     */
    public BigDecimal getRemainingShipQuantity() {
        if (quantity == null)
            return BigDecimal.ZERO;
        BigDecimal quantityBd = new BigDecimal(quantity);
        return quantityBd.subtract(shippedQuantity != null ? shippedQuantity : BigDecimal.ZERO);
    }

    /**
     * Check if all products are shipped
     */
    public boolean isFullyShipped() {
        return getRemainingShipQuantity().compareTo(BigDecimal.ZERO) <= 0;
    }

    /**
     * Calculate total including VAT: quantity × unitPrice × (1 + vatRate)
     */
    public BigDecimal getTotalPrice() {
        if (unitPriceExcludingVat == null || quantity == null || vatRate == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal subtotal = unitPriceExcludingVat.multiply(new BigDecimal(quantity));
        BigDecimal vatAmount = subtotal.multiply(vatRate);
        return subtotal.add(vatAmount);
    }
}
