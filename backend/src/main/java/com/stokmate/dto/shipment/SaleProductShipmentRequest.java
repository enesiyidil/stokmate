package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request to ship a specific quantity of a sale product
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleProductShipmentRequest {
    private UUID saleProductId;
    private BigDecimal quantityToShip;
}
