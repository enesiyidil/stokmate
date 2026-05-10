package com.stokmate.dto.auth;

import lombok.Data;

@Data
public class ReauthRequest {
    private String email;
    private String password;
    private String twoFactorCode; // nullable, only required if user has 2FA enabled
}
