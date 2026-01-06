package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ProductPriceHistory tracks pricing information for products
 * including gross/net prices, discounts, and VAT
 */
@Entity
@Table(name = "product_price_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

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

    @Column(precision = 5, scale = 2)
    private BigDecimal vat;

    @Column(length = 100)
    private String paymentCondition;

    @Column(length = 500)
    private String paymentConditionDefinition;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal quantity; // Quantity associated with this price entry

    @Column(nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal remainingQuantity = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order relatedOrder; // If this price is from an order

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
