package com.stokmate.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderNoteResponse {
    private String id;
    private String content;
    private boolean strikethrough;
    private String createdByName;
    private String createdByEmail;
    private LocalDateTime createdAt;
    private String strikethroughByName;
    private LocalDateTime strikethroughAt;
}
