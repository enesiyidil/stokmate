package com.stokmate.dto.request;

import com.stokmate.domain.RequestStatus;
import com.stokmate.domain.RequestType;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RequestResponse {
    private UUID id;
    private RequestType type;
    private RequestStatus status;
    private String message;
    private UUID ownerId;
    private Instant createdAt;
}
