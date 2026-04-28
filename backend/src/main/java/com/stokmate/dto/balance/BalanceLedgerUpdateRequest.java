package com.stokmate.dto.balance;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class BalanceLedgerUpdateRequest {
    private String notes;
    private BigDecimal totalAmount;
    private LocalDate dueDate;
}
