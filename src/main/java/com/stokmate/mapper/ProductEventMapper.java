package com.stokmate.mapper;

import com.stokmate.domain.ProductEvent;
import com.stokmate.dto.product.ProductEventResponse;
import org.springframework.stereotype.Component;

@Component
public class ProductEventMapper {

    public ProductEventResponse toResponse(ProductEvent event) {
        return ProductEventResponse.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .quantityChange(event.getQuantityChange())
                .priceAtEvent(event.getPriceAtEvent())
                .description(event.getDescription())
                .eventData(event.getEventData())
                .createdByName(event.getCreatedBy() != null
                        ? event.getCreatedBy().getFirstName() + " " + event.getCreatedBy().getLastName()
                        : null)
                .createdAt(event.getCreatedAt())
                .build();
    }
}
