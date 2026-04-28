package com.stokmate.dto.shipment;

import com.stokmate.domain.DeliveryStatus;
import com.stokmate.domain.ProblemType;
import com.stokmate.domain.ShipmentStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ShipmentResponse {
    private UUID id;
    private UUID orderId;
    private String orderNo;
    private String customerName;
    private LocalDate orderDate;
    private LocalDateTime plannedShipmentDate;
    private LocalDateTime actualShipmentDate;
    private UUID shippedById;
    private String shippedByName;
    private DeliveryStatus deliveryStatus;
    private ProblemType problemType;
    private String deliveryNotes;
    private String signedDocumentUrl;
    private List<String> deliveryPhotoUrls;
    private ShipmentStatus status;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvalDate;

    // Sale related fields
    private UUID saleId;
    private String saleNo;
    private String shipmentType; // ORDER or SALE

    // Brand info
    private String brand; // DOGTAS, LOVA, KELEBEK

    // Problem resolution
    private boolean problemResolved;
}
