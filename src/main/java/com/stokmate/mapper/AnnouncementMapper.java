package com.stokmate.mapper;

import com.stokmate.domain.Announcement;
import com.stokmate.dto.announcement.AnnouncementResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AnnouncementMapper {
    @Mapping(target = "createdByFullName", expression = "java(announcement.getCreatedBy().getFirstName() + \" \" + announcement.getCreatedBy().getLastName())")
    AnnouncementResponse toResponse(Announcement announcement);
}
