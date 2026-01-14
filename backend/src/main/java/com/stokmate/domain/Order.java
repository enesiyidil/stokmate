package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String orderNo;

    @Column(nullable = true)
    private String prosapContractNo;

    @Column(nullable = false)
    private String prosapContractNameSurname;

    @Column(nullable = false)
    private LocalDate orderDate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default
    private Set<OrderProduct> products = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.DEVAM_EDIYOR;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean productsAccepted = false;

    @Column
    private String invoiceFileKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderType orderType = OrderType.STOCK;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // New fields for three-tier order system

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_consultant_id")
    private User salesConsultant; // For customer-specific orders

    // Partial delivery tracking fields (ORDER level)
    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean partialDeliveryMarked = false;

    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_last_updated_by")
    private User deliveryLastUpdatedBy;

    @Column
    private java.time.LocalDateTime deliveryLastUpdatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SshServiceType sshServiceType = SshServiceType.NONE;

    @Enumerated(EnumType.STRING)
    private DeliveryDestination deliveryDestination;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean partialShipmentEnabled = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_order_id")
    private Order parentOrder; // For SSH sub-orders

    // Hide SSH orders created from problematic shipments from main orders list
    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean hidden = false;

    // Track which shipment triggered this SSH order (for problematic delivery SSH)
    @Column(name = "linked_shipment_id")
    private UUID linkedShipmentId;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String orderNotes;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = OrderStatus.CREATED;
        }
        // Ensure productsAccepted defaults to false
        if (!this.productsAccepted) {
            this.productsAccepted = false;
        }
        // Ensure orderType defaults to STOCK
        if (this.orderType == null) {
            this.orderType = OrderType.STOCK;
        }
        // Ensure sshServiceType defaults to NONE
        if (this.sshServiceType == null) {
            this.sshServiceType = SshServiceType.NONE;
        }
        // Ensure partialShipmentEnabled defaults to false
        if (!this.partialShipmentEnabled) {
            this.partialShipmentEnabled = false;
        }
    }

    /**
     * Adds a product to the order and sets the bidirectional relationship
     */
    public void addProduct(OrderProduct product) {
        products.add(product);
        product.setOrder(this); // Set the order reference
    }

    public void removeProduct(OrderProduct product) {
        products.remove(product);
        product.setOrder(null);
    }
}
