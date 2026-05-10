package com.stokmate.dto.feedback;

import com.stokmate.domain.FeedbackSeverity;
import com.stokmate.domain.FeedbackStatus;
import com.stokmate.domain.FeedbackType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FeedbackSummaryResponse {

    private UUID id;
    private FeedbackType type;
    private String title;
    private FeedbackStatus status;
    private FeedbackSeverity severity;
    private Integer rating;
    private String createdByName;
    private String createdByEmail;
    private LocalDateTime createdAt;
    private int responseCount;
}
