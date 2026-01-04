package com.stokmate.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductArrivalResponse {
    private UUID id;
    private UUID productId;
    private UUID orderId;
    private String orderNo;
    private BigDecimal quantity;
    private BigDecimal arrivalPrice;
    private BigDecimal vatRate;
    private Instant arrivedAt;
    private String receivedBy;
}
