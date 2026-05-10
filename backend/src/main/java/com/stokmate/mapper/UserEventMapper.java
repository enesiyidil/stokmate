package com.stokmate.mapper;

import com.stokmate.domain.UserEvent;
import com.stokmate.dto.event.UserEventRequest;
import com.stokmate.dto.event.UserEventResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserEventMapper {
    UserEvent toEntity(UserEventRequest request);

    @org.mapstruct.Mapping(target = "type", constant = "USER_EVENT")
    UserEventResponse toResponse(UserEvent userEvent);

    void updateEntityFromRequest(UserEventRequest request, @MappingTarget UserEvent entity);
}
