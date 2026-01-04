package com.stokmate.dto.sale;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for sale product requests
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleProductRequest {

    private UUID productId;

    private Integer quantity;

    private BigDecimal unitPriceExcludingVat;

    private BigDecimal vatRate;

    private BigDecimal internetSalesPrice; // Reference price
}
