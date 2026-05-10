package com.stokmate.dto.balance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractOption {
    private UUID id;
    private String contractNo;
    private String type; // "SALE" or "ORDER"
    private String label; // Display label
    private BigDecimal totalAmount;
}
