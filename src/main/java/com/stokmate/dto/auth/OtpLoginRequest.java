package com.stokmate.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OtpLoginRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String code;
}
