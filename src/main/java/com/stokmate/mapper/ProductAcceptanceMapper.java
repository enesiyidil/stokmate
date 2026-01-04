package com.stokmate.mapper;

import com.stokmate.domain.ProductAcceptance;
import com.stokmate.dto.acceptance.ProductAcceptanceResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductAcceptanceMapper {

    @Mapping(source = "orderProduct.order.orderNo", target = "orderNumber")
    @Mapping(source = "orderProduct.productName", target = "productName")
    @Mapping(source = "orderProduct.productCode", target = "productCode")
    @Mapping(source = "imagePaths", target = "imageUrls")
    @Mapping(source = "acceptedBy.firstName", target = "acceptedByName")
    @Mapping(source = "acceptedBy.email", target = "acceptedByEmail")
    @Mapping(source = "status", target = "status")
    ProductAcceptanceResponse toResponse(ProductAcceptance productAcceptance);
}
