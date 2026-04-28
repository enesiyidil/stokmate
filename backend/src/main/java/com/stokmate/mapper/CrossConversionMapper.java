package com.stokmate.mapper;

import com.stokmate.domain.CrossConversion;
import com.stokmate.dto.crossconversion.CrossConversionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CrossConversionMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.firstName", target = "customerFirstName")
    @Mapping(source = "customer.lastName", target = "customerLastName")
    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.orderNo", target = "orderNo")
    @Mapping(source = "order.prosapContractNo", target = "contractNo")
    @Mapping(source = "order.orderType", target = "orderType")
    @Mapping(source = "sourceBrand", target = "sourceBrand")
    @Mapping(source = "targetBrand", target = "targetBrand")
    CrossConversionResponse toResponse(CrossConversion entity);
}
