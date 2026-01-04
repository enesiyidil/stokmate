package com.stokmate.dto.product;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class ProductDetailsResponse {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private String brand;
    private String imageUrl;
    private boolean activeForSale;
    private boolean customerOwned;
    private BigDecimal stockQuantity;
    private BigDecimal vatRate;
    private BigDecimal arrivalPrice;
    private BigDecimal internetSalesPrice;
    private BigDecimal minStockLevel;
    private Set<String> keywords;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;

    // Additional data for details page
    private List<ProductEventResponse> recentEvents;
    private List<ProductPriceHistoryResponse> priceHistory;
}
