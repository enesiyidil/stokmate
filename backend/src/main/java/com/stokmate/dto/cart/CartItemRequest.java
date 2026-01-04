package com.stokmate.dto.cart;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CartItemRequest {
    private UUID productId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal vatRate;
    private BigDecimal internetSalesPrice;
}
