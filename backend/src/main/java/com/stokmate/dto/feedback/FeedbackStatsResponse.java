package com.stokmate.dto.feedback;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedbackStatsResponse {

    private long total;
    private long newCount;
    private long reviewedCount;
    private long inProgressCount;
    private long implementedCount;
    private long closedCount;
    private long wontFixCount;

    private long bugReportCount;
    private long featureRequestCount;
    private long suggestionCount;
    private long generalCount;
}
