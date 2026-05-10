package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request to create a partial shipment for specific products
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartialShipmentRequest {

    private UUID orderId;

    private List<ProductShipmentRequest> productShipments;

    private String notes;
}
