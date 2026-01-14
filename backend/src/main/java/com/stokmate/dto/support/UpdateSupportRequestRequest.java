package com.stokmate.dto.support;

import com.stokmate.domain.RequestStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateSupportRequestRequest {
    private RequestStatus status;
    private String resolution;
    private UUID assignedToId;
}
