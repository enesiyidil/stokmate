package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to update delivery details after completion but before final approval
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDetailsUpdateRequest {
    private String deliveryNotes;
}
