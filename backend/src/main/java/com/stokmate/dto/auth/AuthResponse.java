package com.stokmate.dto.auth;

import com.stokmate.dto.user.UserResponse;

public record AuthResponse(
        String token,
        UserResponse user,
        boolean requiresTwoFactor,
        boolean requiresSetup,
        String qrCodeImage,
        String totpSecret) {
    // Constructor for normal login (no 2FA)
    public AuthResponse(String token, UserResponse user) {
        this(token, user, false, false, null, null);
    }

    // Factory method for 2FA required response
    public static AuthResponse requireTwoFactor(UserResponse user) {
        return new AuthResponse(null, user, true, false, null, null);
    }

    // Factory method for 2FA setup required
    public static AuthResponse requireSetup(UserResponse user, String qrCodeImage, String totpSecret) {
        return new AuthResponse(null, user, false, true, qrCodeImage, totpSecret);
    }
}
