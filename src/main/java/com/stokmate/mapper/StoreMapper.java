package com.stokmate.mapper;

import com.stokmate.domain.Store;
import com.stokmate.dto.store.StoreResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { UserMapper.class })
public interface StoreMapper {

    @Mapping(target = "manager", source = "manager")
    StoreResponse toResponse(Store store);
}
