package com.stokmate.mapper;

import com.stokmate.domain.StoreEmployee;
import com.stokmate.dto.store.StoreEmployeeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { UserMapper.class })
public interface StoreEmployeeMapper {

    @Mapping(target = "user", source = "user")
    StoreEmployeeResponse toResponse(StoreEmployee storeEmployee);
}
