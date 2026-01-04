package com.stokmate.controller;

import com.stokmate.dto.auth.AuthRequest;
import com.stokmate.dto.auth.AuthResponse;
import com.stokmate.dto.auth.RegisterRequest;
import com.stokmate.dto.auth.OtpLoginRequest;
import com.stokmate.dto.auth.PasswordUpdateRequest;
import com.stokmate.dto.auth.ForgotPasswordRequest;
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
}
