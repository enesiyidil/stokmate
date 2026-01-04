package com.stokmate.dto.shipment;

import com.stokmate.domain.ApprovalStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ShipmentApprovalResponse {
    private UUID id;
    private UUID orderId;
    private String orderNo;
    private UUID requestedById;
    private String requestedByName;
    private LocalDateTime requestDate;
    private ApprovalStatus status;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvalDate;
    private String rejectionReason;
}
