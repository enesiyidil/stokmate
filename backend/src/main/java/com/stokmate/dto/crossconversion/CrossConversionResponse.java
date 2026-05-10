package com.stokmate.dto.crossconversion;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrossConversionResponse {
    private UUID id;

    // Customer info
    private UUID customerId;
    private String customerFirstName;
    private String customerLastName;

    // Order/contract info
    private UUID orderId;
    private String orderNo;
    private String contractNo;
    private String orderType; // STOCK or CUSTOMER_SPECIFIC

    // Brands
    private String sourceBrand;
    private String targetBrand;

    private String notes;
    private Instant createdAt;
    private String createdBy;
}
