package com.stokmate.mapper;

import com.stokmate.domain.OrderReceiptPhoto;
import com.stokmate.dto.orderreceipt.OrderReceiptPhotoResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderReceiptPhotoMapper {

    @Mapping(target = "downloadUrl", ignore = true) // Will be set by service layer with presigned URL
    OrderReceiptPhotoResponse toResponse(OrderReceiptPhoto photo);
}
