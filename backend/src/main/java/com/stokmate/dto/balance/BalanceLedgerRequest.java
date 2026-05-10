package com.stokmate.dto.balance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class BalanceLedgerRequest {
    @NotNull
    private UUID customerId;

    @NotBlank
    private String contractType; // "SALE" or "ORDER"

    @NotNull
    private UUID contractId;

    @NotNull
    private BigDecimal paidAmount;

    @NotNull
    private LocalDate dueDate;

    private String notes;
}
