package com.stokmate.service;

import com.stokmate.domain.Role;
import com.stokmate.domain.User;
import com.stokmate.dto.auth.AuthRequest;
import com.stokmate.dto.auth.AuthResponse;
import com.stokmate.dto.auth.RegisterRequest;
import com.stokmate.dto.auth.OtpLoginRequest;
import com.stokmate.dto.auth.PasswordUpdateRequest;
import com.stokmate.dto.auth.ForgotPasswordRequest;
import com.stokmate.dto.auth.TwoFactorVerifyRequest;
import com.stokmate.dto.auth.ReauthRequest;
import com.stokmate.dto.user.UserResponse;
import com.stokmate.dto.user.UserResponse;
import com.stokmate.exception.ApiException;
import com.stokmate.exception.BadRequestException;
import com.stokmate.repository.UserRepository;
import com.stokmate.security.JwtTokenProvider;
import com.stokmate.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final TwoFactorAuthService twoFactorAuthService;

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();
        if (!user.isTempCodeUsed() && user.getTempCodeExpiresAt() != null
                && user.getTempCodeExpiresAt().isAfter(Instant.now())) {
            throw new BadRequestException("One-time code must be used to activate this account");
        }

        // Check if 2FA is enabled for this user
        if (user.isTotpEnabled()) {
            // If secret is missing (legacy users), generate it
            if (user.getTotpSecret() == null) {
                String newSecret = twoFactorAuthService.generateSecret();
                user.setTotpSecret(newSecret);
                user.setTotpSetupCompleted(false);
                userRepository.save(user);
            }

            UserResponse userResponse = UserResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole())
                    .active(user.isActive())
                    .build();

            // Check if user has completed 2FA setup (scanned QR code)
            if (!user.isTotpSetupCompleted()) {
                Map<String, String> qrData = twoFactorAuthService.generateQRCode(user);
                return AuthResponse.requireSetup(
                        userResponse,
                        qrData.get("qrCodeImage"),
                        qrData.get("secret"));
            }

            return AuthResponse.requireTwoFactor(userResponse);
        }

        String token = jwtTokenProvider.generateToken(principal.getUser());
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .build();
        return new AuthResponse(token, userResponse);
    }

    public UserResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot create ADMIN users via API");
        }
        userRepository.findByEmail(request.getEmail().toLowerCase())
                .ifPresent(u -> {
                    throw new BadRequestException("Email already in use");
                });
        String otp = generateOtp();
        User user = new User();
        user.setEmail(request.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(otp)); // placeholder password to satisfy UserDetails
        user.setRole(request.getRole() == null ? Role.STORE_EMPLOYEE : request.getRole());
        user.setActive(true);
        user.setTempCodeHash(passwordEncoder.encode(otp));
        user.setTempCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        user.setTempCodeUsed(false);

        // Auto-enable 2FA for non-ADMIN users
        if (user.getRole() != Role.ADMIN) {
            String totpSecret = twoFactorAuthService.generateSecret();
            user.setTotpSecret(totpSecret);
            user.setTotpEnabled(true);
        }

        userRepository.save(user);

        notificationService.sendOtpEmail(user.getEmail(), otp);

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public AuthResponse loginWithOtp(OtpLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid code or email"));
        if (user.isTempCodeUsed()) {
            throw new BadRequestException("Code already used");
        }
        if (user.getTempCodeExpiresAt() == null || user.getTempCodeExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Code expired");
        }
        if (user.getTempCodeHash() == null || !passwordEncoder.matches(request.getCode(), user.getTempCodeHash())) {
            throw new BadRequestException("Invalid code or email");
        }
        user.setTempCodeUsed(true);
        user.setTempCodeHash(null);
        user.setTempCodeExpiresAt(null);
        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user);
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .build();
        return new AuthResponse(token, userResponse);
    }

    public boolean updatePassword(User user, PasswordUpdateRequest request) {
        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Mevcut şifre hatalı");
        }

        // Verify 2FA if enabled
        if (user.isTotpEnabled() && user.isTotpSetupCompleted()) {
            if (request.getTotpCode() == null || request.getTotpCode().isEmpty()) {
                throw new BadRequestException("2FA kodu gerekli");
            }
            int codeValue = Integer.parseInt(request.getTotpCode());
            boolean isValid = twoFactorAuthService.verifyCode(user.getEmail(), codeValue);
            if (!isValid) {
                throw new BadRequestException("2FA kodu hatalı");
            }
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTempCodeUsed(true);
        user.setTempCodeHash(null);
        user.setTempCodeExpiresAt(null);
        userRepository.save(user);
        return true;
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public User getCurrentUserOrThrow() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Geçerli bir oturum bulunamadı");
        }
        return ((UserPrincipal) authentication.getPrincipal()).getUser();
    }

    public boolean sendResetCode(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadRequestException("If this email exists, a code will be sent"));
        String otp = generateOtp();
        user.setTempCodeHash(passwordEncoder.encode(otp));
        user.setTempCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        user.setTempCodeUsed(false);
        user.setPassword(passwordEncoder.encode(otp)); // temporary password safeguard
        userRepository.save(user);
        notificationService.sendOtpEmail(user.getEmail(), otp);
        return true;
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * Verify 2FA code and complete login
     */
    public AuthResponse verify2FA(TwoFactorVerifyRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        int codeValue = Integer.parseInt(request.getCode());
        boolean isValid = twoFactorAuthService.verifyCode(request.getEmail(), codeValue);
        if (!isValid) {
            throw new BadRequestException("Invalid verification code");
        }

        String token = jwtTokenProvider.generateToken(user);
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .build();
        return new AuthResponse(token, userResponse);
    }

    public AuthResponse completeSetup(TwoFactorVerifyRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.isTotpEnabled() || user.getTotpSecret() == null) {
            throw new BadRequestException("2FA is not enabled for this user");
        }

        // Verify the code
        int codeValue = Integer.parseInt(request.getCode());
        boolean isValid = twoFactorAuthService.verifyCode(request.getEmail(), codeValue);

        if (!isValid) {
            throw new BadRequestException("Invalid 2FA code");
        }

        // Mark setup as completed
        user.setTotpSetupCompleted(true);
        userRepository.save(user);

        // Generate token and return
        String token = jwtTokenProvider.generateToken(user);
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .build();

        return new AuthResponse(token, userResponse);
    }

    /**
     * Re-authenticate a user when their session token has expired.
     * This allows continuing work without full logout/login cycle.
     */
    public AuthResponse reauthenticate(ReauthRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Kullanıcı bulunamadı"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Şifre hatalı");
        }

        // Check if user is still active
        if (!user.isActive()) {
            throw new BadRequestException("Hesabınız devre dışı bırakılmış");
        }

        // Check 2FA if enabled
        if (user.isTotpEnabled() && user.isTotpSetupCompleted()) {
            if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isEmpty()) {
                // Return response indicating 2FA is required
                UserResponse userResponse = UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole())
                        .active(user.isActive())
                        .build();
                return AuthResponse.requireTwoFactor(userResponse);
            }

            // Verify 2FA code
            int codeValue = Integer.parseInt(request.getTwoFactorCode());
            boolean isValid = twoFactorAuthService.verifyCode(user.getEmail(), codeValue);
            if (!isValid) {
                throw new BadRequestException("2FA kodu hatalı");
            }
        }

        // Generate new token
        String token = jwtTokenProvider.generateToken(user);
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .build();

        return new AuthResponse(token, userResponse);
    }
}
