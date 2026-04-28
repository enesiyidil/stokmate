package com.stokmate.dto.balance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalancePaymentResponse {
    private UUID id;
    private BigDecimal amount;
    private String paidByFirstName;
    private String paidByLastName;
    private String paidByEmail;
    private LocalDate nextDueDate;
    private String notes;
    private LocalDateTime createdAt;
}
