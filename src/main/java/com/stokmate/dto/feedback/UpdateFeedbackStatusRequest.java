package com.stokmate.dto.feedback;

import com.stokmate.domain.FeedbackStatus;
import lombok.Data;

@Data
public class UpdateFeedbackStatusRequest {

    private FeedbackStatus status;

    private String adminNote;
}
