package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response containing shipment progress information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentProgressResponse {
    private int totalProducts;
    private int shippedProducts;
    private double percentComplete;
    private int shipmentsCount;
    private int pendingShipments;
}
