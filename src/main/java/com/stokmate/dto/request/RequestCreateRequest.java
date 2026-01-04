package com.stokmate.dto.request;

import com.stokmate.domain.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestCreateRequest {
    @NotNull
    private RequestType type;

    @NotBlank
    private String message;
}
