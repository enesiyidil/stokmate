package com.stokmate.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeleteUserWithAliasRequest {
    @NotBlank(message = "Alias is required")
    @Size(min = 3, max = 50, message = "Alias must be between 3 and 50 characters")
    private String alias;
}
