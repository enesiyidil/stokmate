package com.stokmate.dto.user;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ToggleUserActiveRequest {
    @NotNull(message = "Active status is required")
    private Boolean active;
}
