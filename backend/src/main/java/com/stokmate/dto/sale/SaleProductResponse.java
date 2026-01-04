package com.stokmate.dto.sale;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for sale product responses
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleProductResponse {

    private UUID id;

    private UUID productId;

    private String productCode;

    private String productName;

    private String productImageUrl;

    private Integer quantity;

    private BigDecimal unitPriceExcludingVat;

    private BigDecimal vatRate;

    private BigDecimal internetSalesPrice;

    private BigDecimal totalPrice; // Calculated: quantity × unitPrice × (1 + vatRate)
}
