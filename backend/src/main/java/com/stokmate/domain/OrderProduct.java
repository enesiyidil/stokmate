package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * OrderProduct represents a product within an order (specific to orders,
 * independent from main Product entity)
 */
@Entity
@Table(name = "order_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderProduct extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String productCode;

    private String specName;

    private String productGroupDefinition;

    private String warehouseLocation;

    private String productionLocationName;

    @Column(precision = 19, scale = 2)
    private BigDecimal grossPrice;

    @Column(precision = 19, scale = 2)
    private BigDecimal netPrice;

    @Column(precision = 19, scale = 2)
    private BigDecimal fixedDiscount;

    @Column(precision = 19, scale = 2)
    private BigDecimal cashDiscount;

    @Column(precision = 19, scale = 2)
    private BigDecimal displayDiscount;

    @Column(precision = 19, scale = 2)
    private BigDecimal discount1;

    @Column(precision = 19, scale = 2)
    private BigDecimal discount2;

    @Column(precision = 19, scale = 2)
    private BigDecimal discount3;

    @Column(precision = 19, scale = 2)
    private BigDecimal discount4;

    @Column(precision = 19, scale = 2)
    private BigDecimal discount5;

    @Column(precision = 19, scale = 4)
    private BigDecimal vat; // Stored as decimal (e.g., 0.10 for 10%)

    private String paymentCondition;

    private String paymentConditionDefinition;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal acceptedQuantity = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal shippedQuantity = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    private Brand brand;

    /**
     * Calculate remaining quantity to be accepted
     */
    public BigDecimal getRemainingQuantity() {
        if (quantity == null)
            return BigDecimal.ZERO;
        return quantity.subtract(acceptedQuantity != null ? acceptedQuantity : BigDecimal.ZERO);
    }

    /**
     * Check if product is fully accepted
     */
    public boolean isFullyAccepted() {
        return getRemainingQuantity().compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Calculate remaining quantity to be shipped (from accepted quantity)
     */
    public BigDecimal getRemainingShipQuantity() {
        if (acceptedQuantity == null)
            return BigDecimal.ZERO;
        return acceptedQuantity.subtract(shippedQuantity != null ? shippedQuantity : BigDecimal.ZERO);
    }

    /**
     * Check if all accepted products are shipped
     */
    public boolean isFullyShipped() {
        return getRemainingShipQuantity().compareTo(BigDecimal.ZERO) <= 0;
    }
}
