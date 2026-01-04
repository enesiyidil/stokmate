package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Individual product shipment within a partial shipment request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductShipmentRequest {

    private UUID orderProductId;

    private BigDecimal quantityToShip;
}
