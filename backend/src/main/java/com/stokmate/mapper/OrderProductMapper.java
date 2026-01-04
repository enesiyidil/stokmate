package com.stokmate.mapper;

import com.stokmate.domain.OrderProduct;
import com.stokmate.dto.order.OrderProductCreateRequest;
import com.stokmate.dto.order.OrderProductExcelRow;
import com.stokmate.dto.order.OrderProductResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderProductMapper {

    @Mapping(target = "order", ignore = true)
    OrderProduct toEntity(OrderProductCreateRequest request);

    OrderProductResponse toResponse(OrderProduct entity);

    @Mapping(target = "order", ignore = true)
    OrderProduct toEntityFromExcelRow(OrderProductExcelRow excelRow);

    OrderProductExcelRow toExcelRow(OrderProduct entity);
}
