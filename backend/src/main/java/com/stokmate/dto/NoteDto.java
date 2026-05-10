package com.stokmate.dto;

import com.stokmate.domain.LinkedEntityType;
import com.stokmate.domain.NotePriority;
import com.stokmate.domain.NoteStatus;
import com.stokmate.domain.NoteTag;
import com.stokmate.domain.NoteType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteDto {
    private UUID id;
    private String title;
    private String content;
    private NoteType noteType;
    private NotePriority priority;
    private NoteStatus status;
    private List<NoteTag> tags;
    private LinkedEntityType linkedEntityType;
    private String linkedEntityId;
    private List<NoteItemDto> items;
    private String color;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;
}
