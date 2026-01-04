package com.stokmate.dto.sale;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SaleItemResponse {
    private UUID id;
    private UUID productId;
    private BigDecimal quantity;
    private String productCodeSnapshot;
    private String nameSnapshot;
    private BigDecimal unitPriceSnapshot;
    private BigDecimal vatRateSnapshot;
    private BigDecimal lineNet;
    private BigDecimal lineVat;
    private BigDecimal lineGross;
}
