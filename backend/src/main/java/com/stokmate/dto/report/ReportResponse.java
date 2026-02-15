package com.stokmate.dto.report;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {

    private UUID id;
    private String reportNo;
    private String reportType;
    private String status;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String filters;
    private Integer totalRecords;
    private BigDecimal totalRevenue;
    private BigDecimal totalCost;
    private BigDecimal totalProfit;
    private String createdByName;
    private String createdByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String pdfFileKey;
}
