package com.stokmate.dto.product;

import com.stokmate.domain.ProductStockHistory.StockChangeType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductStockHistoryResponse {
    private UUID id;
    private BigDecimal oldQuantity;
    private BigDecimal newQuantity;
    private BigDecimal changeAmount;
    private String reason;
    private StockChangeType type;
    private UUID referenceId;
    private String userEmail;
    private Instant createdAt;
}
