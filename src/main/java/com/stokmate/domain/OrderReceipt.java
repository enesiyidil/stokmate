package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * OrderReceipt represents the acceptance of products from an order.
 * Products can be accepted in multiple batches (product-by-product workflow).
 */
@Entity
@Table(name = "order_receipts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReceipt extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_product_id", nullable = false)
    private OrderProduct orderProduct;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal receivedQuantity;

    @Column(length = 1000)
    private String notes;

    @Column(length = 50)
    private String vehiclePlate;

    @Column(length = 200)
    private String driverName;

    @Column(length = 50)
    private String driverPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderReceiptStatus status = OrderReceiptStatus.PENDING_APPROVAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by_id", nullable = false)
    private User receivedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column
    private Instant approvedAt;

    @Column(length = 1000)
    private String approvalNotes;

    @OneToMany(mappedBy = "orderReceipt", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private Set<OrderReceiptPhoto> photos = new HashSet<>();

    public void addPhoto(OrderReceiptPhoto photo) {
        photos.add(photo);
        photo.setOrderReceipt(this);
    }

    public void removePhoto(OrderReceiptPhoto photo) {
        photos.remove(photo);
        photo.setOrderReceipt(null);
    }
}
