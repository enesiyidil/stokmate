package com.stokmate.dto.store;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StoreEmployeeRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotNull(message = "Join date is required")
    private LocalDate joinDate;
}
