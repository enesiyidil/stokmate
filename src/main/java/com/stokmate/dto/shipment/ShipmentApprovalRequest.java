package com.stokmate.dto.shipment;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ShipmentApprovalRequest {
    private UUID orderId;
}
