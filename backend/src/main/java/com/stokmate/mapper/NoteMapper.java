package com.stokmate.mapper;

import com.stokmate.domain.Note;
import com.stokmate.domain.NoteItem;
import com.stokmate.dto.NoteDto;
import com.stokmate.dto.NoteItemDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface NoteMapper {

    @Mapping(target = "createdDate", source = "createdAt")
    @Mapping(target = "lastModifiedDate", source = "updatedAt")
    NoteDto toDto(Note entity);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "items", ignore = true)
    Note toEntity(NoteDto dto);

    @Mapping(target = "isCompleted", expression = "java(entity.isCompleted())")
    NoteItemDto toItemDto(NoteItem entity);

    @Mapping(target = "note", ignore = true)
    @Mapping(target = "isCompleted", expression = "java(dto.isCompleted())")
    NoteItem toItemEntity(NoteItemDto dto);

    default LocalDateTime instantToLocalDateTime(Instant instant) {
        if (instant == null)
            return null;
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }
}
