package com.stokmate.dto.user;

import com.stokmate.domain.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    @NotNull(message = "Role is required")
    private Role role;
}
