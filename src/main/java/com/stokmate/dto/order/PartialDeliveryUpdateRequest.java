package com.stokmate.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating partial delivery status of an order product
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartialDeliveryUpdateRequest {
    private Boolean partialDeliveryMarked;
    private String notes;
}
