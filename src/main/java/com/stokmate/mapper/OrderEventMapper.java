package com.stokmate.mapper;

import com.stokmate.domain.OrderEvent;
import com.stokmate.dto.order.OrderEventResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { UserMapper.class })
public interface OrderEventMapper {

    @Mapping(target = "orderId", source = "order.id")
    OrderEventResponse toResponse(OrderEvent orderEvent);
}
