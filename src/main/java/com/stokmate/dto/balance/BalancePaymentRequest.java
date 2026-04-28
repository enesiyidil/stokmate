package com.stokmate.dto.balance;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class BalancePaymentRequest {
    @NotNull
    private BigDecimal amount;

    private LocalDate nextDueDate;

    private String notes;
}
