package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request to create a shipment from a sale
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleShipmentRequest {
    private UUID saleId;
    private List<SaleProductShipmentRequest> productShipments;
    private String notes;
}
