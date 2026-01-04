package com.stokmate.dto.sale;

import com.stokmate.domain.SaleStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for sale responses
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleResponse {

    private UUID id;

    private String saleNo;

    // Customer info
    private UUID customerId;
    private String customerName;
    private String customerPhone;

    // Sales consultant info
    private UUID salesConsultantId;
    private String salesConsultantName;

    private String contractNo;

    private String contractFileKey;

    private String contractDownloadUrl; // Presigned URL

    private LocalDate saleDate;

    private SaleStatus status;

    private String notes;

    private List<SaleProductResponse> products;

    private BigDecimal totalAmount; // Sum of all product totals

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;
}
