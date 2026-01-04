package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Sale entity represents a product sale transaction
 */
@Entity
@Table(name = "sales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String saleNo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_consultant_id", nullable = false)
    private User salesConsultant; // The user who created the sale

    @Column(length = 100)
    private String contractNo;

    @Column(name = "contract_file_key")

    private String contractFileKey; // MinIO object key

    @Column(name = "total_gross", nullable = false)
    private java.math.BigDecimal totalGross;

    @Column(name = "total_vat", nullable = false)
    private java.math.BigDecimal totalVat;

    @Column(name = "total_net", nullable = false)
    private java.math.BigDecimal totalNet;

    @Column(nullable = false)
    private LocalDate saleDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SaleStatus status = SaleStatus.DEVAM_EDIYOR;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default
    private Set<SaleProduct> products = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = SaleStatus.DEVAM_EDIYOR;
        }
        if (this.saleDate == null) {
            this.saleDate = LocalDate.now();
        }
        if (this.totalGross == null) {
            this.totalGross = java.math.BigDecimal.ZERO;
        }
        if (this.totalVat == null) {
            this.totalVat = java.math.BigDecimal.ZERO;
        }
        if (this.totalNet == null) {
            this.totalNet = java.math.BigDecimal.ZERO;
        }
    }

    /**
     * Adds a product to the sale and sets the bidirectional relationship
     */
    public void addProduct(SaleProduct product) {
        products.add(product);
        product.setSale(this);
    }

    public void removeProduct(SaleProduct product) {
        products.remove(product);
        product.setSale(null);
    }
}
