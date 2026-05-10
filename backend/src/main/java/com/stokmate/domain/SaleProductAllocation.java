package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "sale_product_allocations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleProductAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_product_id", nullable = false)
    private SaleProduct saleProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_price_history_id", nullable = false)
    private ProductPriceHistory productPriceHistory;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal quantity;
}
