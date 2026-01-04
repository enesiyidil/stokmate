package com.stokmate.dto.request;

import com.stokmate.domain.RequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestStatusUpdateRequest {
    @NotNull
    private RequestStatus status;
}
