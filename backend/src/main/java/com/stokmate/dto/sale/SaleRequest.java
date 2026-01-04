package com.stokmate.dto.sale;

import com.stokmate.domain.SaleStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for creating/updating sales
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleRequest {

    private String saleNo;

    private UUID customerId;

    private UUID salesConsultantId;

    private String contractNo;

    private LocalDate saleDate;

    private SaleStatus status;

    private String notes;

    private List<SaleProductRequest> products;
}
