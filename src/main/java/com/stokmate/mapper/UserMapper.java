package com.stokmate.mapper;

import com.stokmate.domain.User;
import com.stokmate.dto.user.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "currentStoreId", ignore = true)
    @Mapping(target = "currentStoreName", ignore = true)
    @Mapping(target = "storeJoinDate", ignore = true)
    UserResponse toResponse(User user);

    com.stokmate.dto.user.UserBasicResponse toBasicResponse(User user);
}
