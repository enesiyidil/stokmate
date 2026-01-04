package com.stokmate.dto.product;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class ProductEventResponse {
    private UUID id;
    private String eventType;
    private BigDecimal quantityChange;
    private BigDecimal priceAtEvent;
    private String description;
    private Map<String, Object> eventData;
    private String createdByName;
    private LocalDateTime createdAt;
}
