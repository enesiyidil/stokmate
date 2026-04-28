package com.stokmate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteItemDto {
    private Long id;
    private String content;
    @JsonProperty("isCompleted")
    private boolean isCompleted;
    private int position;
}
