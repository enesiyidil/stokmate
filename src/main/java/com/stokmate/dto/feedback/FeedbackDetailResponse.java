package com.stokmate.dto.feedback;

import com.stokmate.domain.FeedbackSeverity;
import com.stokmate.domain.FeedbackStatus;
import com.stokmate.domain.FeedbackType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FeedbackDetailResponse {

    private UUID id;
    private FeedbackType type;
    private String title;
    private String description;
    private String pageUrl;
    private FeedbackSeverity severity;
    private FeedbackStatus status;
    private Integer rating;
    private String adminNote;

    private UUID createdById;
    private String createdByName;
    private String createdByEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<FeedbackResponseDto> responses;
}
