package com.stokmate.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordUpdateRequest {

    @NotBlank
    private String oldPassword;

    @NotBlank
    private String newPassword;

    // 2FA code - required if user has TOTP enabled
    private String totpCode;
}
