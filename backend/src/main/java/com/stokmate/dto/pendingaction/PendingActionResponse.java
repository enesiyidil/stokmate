package com.stokmate.dto.pendingaction;

import com.stokmate.domain.ActionStatus;
import com.stokmate.domain.ActionType;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
public class PendingActionResponse {
    private UUID id;
    private ActionType actionType;
    private String entityType;
    private UUID entityId;
    private String requestedByEmail;
    private String requestedByName;
    private Instant requestedAt;
    private ActionStatus status;
    private Map<String, Object> actionData;
    private String reviewedByEmail;
    private String reviewedByName;
    private Instant reviewedAt;
    private String reviewNotes;
}
