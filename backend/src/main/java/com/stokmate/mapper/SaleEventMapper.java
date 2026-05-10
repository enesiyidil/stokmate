package com.stokmate.mapper;

import com.stokmate.domain.SaleEvent;
import com.stokmate.dto.sale.SaleEventResponse;
import org.springframework.stereotype.Component;

@Component
public class SaleEventMapper {

    public SaleEventResponse toResponse(SaleEvent event) {
        if (event == null) {
            return null;
        }

        String description = event.getDescription();
        if (description == null && event.getEventData() != null
                && event.getEventData().containsKey("description")) {
            description = (String) event.getEventData().get("description");
        }

        return SaleEventResponse.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .description(description)
                .createdAt(event.getCreatedAt())
                .createdByName(
                        event.getUser() != null ? event.getUser().getFirstName() + " " + event.getUser().getLastName()
                                : "Sistem")
                .build();
    }
}
