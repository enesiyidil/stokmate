package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_acceptances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductAcceptance extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_product_id", nullable = false)
    private OrderProduct orderProduct;

    @Column(nullable = false)
    private BigDecimal acceptedQuantity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false)
    private String vehiclePlate;

    @Column(nullable = false)
    private String driverInfo;

    @ElementCollection
    @CollectionTable(name = "acceptance_images", joinColumns = @JoinColumn(name = "product_acceptance_id"))
    @Column(name = "image_path")
    private List<String> imagePaths = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by")
    private User acceptedBy;

    @Column(nullable = false)
    private LocalDateTime acceptanceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AcceptanceStatus status = AcceptanceStatus.PENDING;

    public enum AcceptanceStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
