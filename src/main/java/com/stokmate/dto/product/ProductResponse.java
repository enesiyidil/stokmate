package com.stokmate.dto.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
public class ProductResponse {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private com.stokmate.domain.Brand brand;
    private String imageUrl;
    private boolean activeForSale;
    private BigDecimal stockQuantity;
    private BigDecimal vatRate;
    private BigDecimal unitPrice;
    private BigDecimal internetSalesPrice;
    private BigDecimal minStockLevel;
    private Set<String> keywords;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
}
