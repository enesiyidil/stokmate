package com.stokmate.mapper;

import com.stokmate.domain.OrderReceipt;
import com.stokmate.dto.orderreceipt.OrderReceiptResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = { OrderReceiptPhotoMapper.class, UserMapper.class })
public interface OrderReceiptMapper {

    @Mapping(target = "orderProductId", source = "orderProduct.id")
    @Mapping(target = "orderNo", source = "orderProduct.order.orderNo")
    @Mapping(target = "productCode", source = "orderProduct.productCode")
    @Mapping(target = "productName", source = "orderProduct.productName")
    OrderReceiptResponse toResponse(OrderReceipt orderReceipt);
}
