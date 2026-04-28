package com.stokmate.dto.feedback;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FeedbackResponseDto {

    private UUID id;
    private String message;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
}
