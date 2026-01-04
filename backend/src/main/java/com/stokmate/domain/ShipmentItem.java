package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "shipment_items")
public class ShipmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentItemType itemType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_product_id")
    private OrderProduct orderProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_product_id")
    private SaleProduct saleProduct;

    @Column(nullable = false)
    private Integer shippedQuantity;

    /**
     * Validates that exactly one of orderProduct or saleProduct is set
     */
    @PrePersist
    @PreUpdate
    private void validateItemReference() {
        if ((orderProduct == null && saleProduct == null) || (orderProduct != null && saleProduct != null)) {
            throw new IllegalStateException("ShipmentItem must reference exactly one of OrderProduct or SaleProduct");
        }

        // Auto-set itemType based on which product is set
        if (orderProduct != null) {
            itemType = ShipmentItemType.ORDER_PRODUCT;
        } else {
            itemType = ShipmentItemType.SALE_PRODUCT;
        }
    }
}
