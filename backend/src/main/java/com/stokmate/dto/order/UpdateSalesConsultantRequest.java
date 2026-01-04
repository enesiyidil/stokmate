package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for updating sales consultant on an order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSalesConsultantRequest {

    @JsonProperty("salesConsultantId")
    private UUID salesConsultantId; // nullable - can be null to remove assignment
}
