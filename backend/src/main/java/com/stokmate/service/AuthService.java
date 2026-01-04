package com.stokmate.service;

import com.stokmate.domain.Role;
import com.stokmate.domain.User;
import com.stokmate.dto.auth.AuthRequest;
import com.stokmate.dto.auth.AuthResponse;
import com.stokmate.dto.auth.RegisterRequest;
import com.stokmate.dto.auth.OtpLoginRequest;
import com.stokmate.dto.auth.PasswordUpdateRequest;
import com.stokmate.dto.auth.ForgotPasswordRequest;
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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();
        if (!user.isTempCodeUsed() && user.getTempCodeExpiresAt() != null
                && user.getTempCodeExpiresAt().isAfter(Instant.now())) {
            throw new BadRequestException("One-time code must be used to activate this account");
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
        user.setRole(request.getRole() == null ? Role.MAGAZA_CALISAN : request.getRole());
        user.setActive(true);
        user.setTempCodeHash(passwordEncoder.encode(otp));
        user.setTempCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        user.setTempCodeUsed(false);
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
}
