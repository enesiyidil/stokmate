package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "shipments")
public class Shipment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShipmentItem> items = new ArrayList<>();

    private LocalDateTime plannedShipmentDate;

    private LocalDateTime actualShipmentDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipped_by_id")
    private User shippedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus deliveryStatus;

    @Enumerated(EnumType.STRING)
    private ProblemType problemType;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;

    // File uploads
    private String signedDocumentPath;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "shipment_delivery_photos", joinColumns = @JoinColumn(name = "shipment_id"))
    @Column(name = "photo_path")
    private java.util.Set<String> deliveryPhotoPaths = new java.util.HashSet<>();

    // Final approval
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status = ShipmentStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    private LocalDateTime approvalDate;

    // Notification flags
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean notified1Day = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean notified1Hour = false;

    // Link to SSH order created for this problematic shipment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_ssh_order_id")
    private Order linkedSshOrder;

    private String receiverName;

    /**
     * Helper method to add ShipmentItem with proper bidirectional relationship
     */
    public void addItem(ShipmentItem item) {
        items.add(item);
        item.setShipment(this);
    }
}
