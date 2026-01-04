package com.stokmate.dto.sale;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SaleItemRequest {
    private UUID productId;
    private String productCode;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal quantity;
}
