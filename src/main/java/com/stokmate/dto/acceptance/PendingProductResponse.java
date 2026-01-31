package com.stokmate.dto.acceptance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingProductResponse {

    private String orderProductId;
    private String orderId;
    private String orderNumber;
    private String productName;
    private String productCode;
    private BigDecimal totalQuantity;
    private BigDecimal acceptedQuantity;
    private BigDecimal remainingQuantity;
    private LocalDate orderDate;
    private boolean convertedFromCustomer; // İptal stoğu siparişi mi?
}
