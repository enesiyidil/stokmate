package com.stokmate.dto.auth;

import com.stokmate.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @Email
    @NotBlank
    private String email;

    private Role role = Role.STORE_EMPLOYEE;
}
