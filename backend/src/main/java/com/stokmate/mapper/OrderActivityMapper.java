package com.stokmate.mapper;

import com.stokmate.domain.OrderActivity;
import com.stokmate.dto.order.OrderActivityResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class OrderActivityMapper {

    @org.springframework.beans.factory.annotation.Autowired
    protected com.stokmate.service.UserService userService;

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.orderNo", target = "orderNo")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(target = "userFullName", expression = "java(getUserDisplayNameFromActivity(orderActivity))")
    public abstract OrderActivityResponse toResponse(OrderActivity orderActivity);

    public String getUserDisplayNameFromActivity(OrderActivity orderActivity) {
        if (orderActivity.getUser() != null) {
            return userService.getUserDisplayName(orderActivity.getUser());
        }
        return "Unknown User";
    }
}
