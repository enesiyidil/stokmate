package com.stokmate.dto.support;

import com.stokmate.domain.RequestCategory;
import com.stokmate.domain.RequestPriority;
import com.stokmate.domain.RequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SupportRequestResponse {
    private UUID id;
    private String title;
    private String description;
    private RequestCategory category;
    private RequestStatus status;
    private RequestPriority priority;

    private UUID createdById;
    private String createdByName;
    private String createdByEmail;

    private UUID assignedToId;
    private String assignedToName;

    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
