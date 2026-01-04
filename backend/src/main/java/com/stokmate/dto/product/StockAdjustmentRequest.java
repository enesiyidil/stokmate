package com.stokmate.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockAdjustmentRequest {

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal quantity;

    @NotBlank
    private String reason;
}
