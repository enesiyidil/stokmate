package com.stokmate.mapper;

import com.stokmate.domain.ProductStockHistory;
import com.stokmate.dto.product.ProductStockHistoryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductStockHistoryMapper {

    @Mapping(target = "userEmail", source = "userEmail")
    ProductStockHistoryResponse toResponse(ProductStockHistory entity);
}
