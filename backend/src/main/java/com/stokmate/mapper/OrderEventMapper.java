package com.stokmate.mapper;

import com.stokmate.domain.OrderEvent;
import com.stokmate.dto.order.OrderEventResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { UserMapper.class })
public abstract class OrderEventMapper {

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "description", expression = "java(extractDescription(orderEvent))")
    public abstract OrderEventResponse toResponse(OrderEvent orderEvent);

    protected String extractDescription(OrderEvent event) {
        if (event == null || event.getEventData() == null) {
            return null;
        }
        if (event.getEventData().containsKey("description")) {
            return (String) event.getEventData().get("description");
        }
        return null;
    }
}
