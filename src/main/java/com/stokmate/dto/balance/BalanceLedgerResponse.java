package com.stokmate.dto.balance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceLedgerResponse {
    private UUID id;

    // Customer info
    private UUID customerId;
    private String customerFirstName;
    private String customerLastName;

    // Contract info
    private String contractType;
    private UUID contractId;
    private String contractNo;

    // Amounts
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;

    // Due date
    private LocalDate dueDate;

    // Status
    private String status;

    private String notes;

    // Payments
    private List<BalancePaymentResponse> payments;

    // Audit
    private Instant createdAt;
    private String createdBy;
}
