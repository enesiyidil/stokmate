package com.stokmate.controller;

import com.stokmate.dto.auth.AuthRequest;
import com.stokmate.dto.auth.AuthResponse;
import com.stokmate.dto.auth.RegisterRequest;
import com.stokmate.dto.auth.OtpLoginRequest;
import com.stokmate.dto.auth.PasswordUpdateRequest;
import com.stokmate.dto.auth.ForgotPasswordRequest;
import com.stokmate.dto.auth.TwoFactorVerifyRequest;
import com.stokmate.dto.auth.ReauthRequest;
import com.stokmate.dto.user.UserResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public boolean forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.sendResetCode(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login/otp")
    public AuthResponse loginWithOtp(@Valid @RequestBody OtpLoginRequest request) {
        return authService.loginWithOtp(request);
    }

    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/me/password")
    public boolean updatePassword(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PasswordUpdateRequest request) {
        return authService.updatePassword(principal.getUser(), request);
    }

    /**
     * Verify 2FA code and complete login
     */
    @PostMapping("/verify-2fa")
    public AuthResponse verify2FA(@Valid @RequestBody TwoFactorVerifyRequest request) {
        return authService.verify2FA(request);
    }

    /**
     * Complete 2FA setup for first-time users
     */
    @PostMapping("/complete-setup")
    public AuthResponse completeSetup(@Valid @RequestBody TwoFactorVerifyRequest request) {
        return authService.completeSetup(request);
    }

    /**
     * Re-authenticate a user when their session token has expired.
     * This endpoint does not require authentication (since token is expired).
     */
    @PostMapping("/reauth")
    public AuthResponse reauthenticate(@Valid @RequestBody ReauthRequest request) {
        return authService.reauthenticate(request);
    }
}
