package com.stokmate.dto.product;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ProductPriceHistoryResponse {
    private UUID id;
    private BigDecimal grossPrice;
    private BigDecimal netPrice;
    private BigDecimal fixedDiscount;
    private BigDecimal cashDiscount;
    private BigDecimal displayDiscount;
    private BigDecimal discount1;
    private BigDecimal discount2;
    private BigDecimal discount3;
    private BigDecimal discount4;
    private BigDecimal discount5;
    private BigDecimal vat;
    private String paymentCondition;
    private String paymentConditionDefinition;
    private BigDecimal quantity;
    private BigDecimal remainingQuantity;
    private String relatedOrderNo;
    private String createdByName;
    private LocalDateTime createdAt;
}
