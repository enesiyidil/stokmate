package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sale_items")
public class SaleItem extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String productCodeSnapshot;

    @Column(nullable = false)
    private String nameSnapshot;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPriceSnapshot;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRateSnapshot;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lineNet;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lineVat;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lineGross;
}
