package com.stokmate.controller;

import com.stokmate.dto.auth.TwoFactorVerifyRequest;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.TwoFactorAuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/2fa")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class TwoFactorAuthController {

    private final TwoFactorAuthService twoFactorAuthService;

    /**
     * Setup 2FA - generate secret and QR code
     */
    @PostMapping("/setup")
    public Map<String, String> setupTwoFactorAuth(@AuthenticationPrincipal UserPrincipal principal) {
        return twoFactorAuthService.setupTwoFactorAuth(principal.getUser().getId());
    }

    /**
     * Enable 2FA after verifying the code
     */
    @PostMapping("/enable")
    public Map<String, Boolean> enableTwoFactorAuth(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TwoFactorVerifyRequest request) {
        int codeValue = Integer.parseInt(request.getCode());
        boolean enabled = twoFactorAuthService.enableTwoFactorAuth(
                principal.getUser().getId(),
                codeValue);
        return Map.of("enabled", enabled);
    }

    /**
     * Disable 2FA
     */
    @PostMapping("/disable")
    public Map<String, Boolean> disableTwoFactorAuth(@AuthenticationPrincipal UserPrincipal principal) {
        twoFactorAuthService.disableTwoFactorAuth(principal.getUser().getId());
        return Map.of("disabled", true);
    }

    /**
     * Get 2FA status for current user
     */
    @GetMapping("/status")
    public Map<String, Boolean> getTwoFactorStatus(@AuthenticationPrincipal UserPrincipal principal) {
        boolean enabled = twoFactorAuthService.isTwoFactorEnabled(principal.getUser().getId());
        return Map.of("enabled", enabled);
    }

    /**
     * Verify 2FA code for client-side gating
     */
    @PostMapping("/verify-code")
    public boolean verifyCode(@AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null)
            return false;
        try {
            return twoFactorAuthService.verifyCode(principal.getUser(), Integer.parseInt(code));
        } catch (Exception e) {
            return false;
        }
    }
}
