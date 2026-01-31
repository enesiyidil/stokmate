package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Role;
import com.stokmate.domain.User;
import com.stokmate.dto.auth.*;
import com.stokmate.dto.user.UserResponse;
import com.stokmate.exception.ApiException;
import com.stokmate.exception.BadRequestException;
import com.stokmate.repository.UserRepository;
import com.stokmate.security.JwtTokenProvider;
import com.stokmate.security.UserPrincipal;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TwoFactorAuthService twoFactorAuthService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                authenticationManager,
                passwordEncoder,
                userRepository,
                jwtTokenProvider,
                notificationService,
                twoFactorAuthService);
    }

    // ========== Helper Methods ==========

    private User createUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.STORE_EMPLOYEE);
        user.setActive(true);
        user.setTempCodeUsed(true);
        user.setTotpEnabled(false);
        return user;
    }

    private AuthRequest createAuthRequest() {
        AuthRequest request = new AuthRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        return request;
    }

    // ========== Login Tests ==========

    @Nested
    @DisplayName("login() Tests")
    class LoginTests {

        @Test
        @DisplayName("Should return token when credentials are valid")
        void login_ShouldReturnToken_WhenCredentialsAreValid() {
            // Arrange
            User user = createUser();
            AuthRequest request = createAuthRequest();
            UserPrincipal principal = new UserPrincipal(user);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(principal);
            when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");

            // Act
            AuthResponse response = authService.login(request);

            // Assert
            assertThat(response.token()).isEqualTo("jwt-token");
            assertThat(response.user().getEmail()).isEqualTo("test@example.com");
            assertThat(response.requiresTwoFactor()).isFalse();
        }

        @Test
        @DisplayName("Should throw exception when credentials are invalid")
        void login_ShouldThrowException_WhenCredentialsAreInvalid() {
            // Arrange
            AuthRequest request = createAuthRequest();
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Invalid credentials"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Should require 2FA when user has TOTP enabled")
        void login_ShouldRequireTwoFactor_WhenTotpEnabled() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSecret("secret");
            user.setTotpSetupCompleted(true);

            AuthRequest request = createAuthRequest();
            UserPrincipal principal = new UserPrincipal(user);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(principal);

            // Act
            AuthResponse response = authService.login(request);

            // Assert
            assertThat(response.requiresTwoFactor()).isTrue();
            assertThat(response.token()).isNull();
        }

        @Test
        @DisplayName("Should require setup when TOTP enabled but not setup completed")
        void login_ShouldRequireSetup_WhenTotpNotSetupCompleted() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSecret("secret");
            user.setTotpSetupCompleted(false);

            AuthRequest request = createAuthRequest();
            UserPrincipal principal = new UserPrincipal(user);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(principal);
            when(twoFactorAuthService.generateQRCode(user))
                    .thenReturn(Map.of("qrCodeImage", "qr-image", "secret", "secret"));

            // Act
            AuthResponse response = authService.login(request);

            // Assert
            assertThat(response.requiresSetup()).isTrue();
            assertThat(response.qrCodeImage()).isEqualTo("qr-image");
            assertThat(response.token()).isNull();
        }

        @Test
        @DisplayName("Should throw exception when temp code not used")
        void login_ShouldThrowException_WhenTempCodeNotUsed() {
            // Arrange
            User user = createUser();
            user.setTempCodeUsed(false);
            user.setTempCodeExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));

            AuthRequest request = createAuthRequest();
            UserPrincipal principal = new UserPrincipal(user);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(principal);

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("One-time code must be used");
        }
    }

    // ========== Register Tests ==========

    @Nested
    @DisplayName("register() Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should create user successfully")
        void register_ShouldCreateUser_WhenValidRequest() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("NEW@EXAMPLE.COM");
            request.setRole(Role.STORE_EMPLOYEE);

            when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");
            when(twoFactorAuthService.generateSecret()).thenReturn("totp-secret");

            // Act
            UserResponse response = authService.register(request);

            // Assert
            assertThat(response.getEmail()).isEqualTo("new@example.com");
            assertThat(response.getRole()).isEqualTo(Role.STORE_EMPLOYEE);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.isTotpEnabled()).isTrue();
            assertThat(savedUser.getTotpSecret()).isEqualTo("totp-secret");

            verify(notificationService).sendOtpEmail(eq("new@example.com"), anyString());
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void register_ShouldThrowException_WhenEmailExists() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("existing@example.com");

            when(userRepository.findByEmail("existing@example.com"))
                    .thenReturn(Optional.of(createUser()));

            // Act & Assert
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Email already in use");
        }

        @Test
        @DisplayName("Should throw exception when trying to create ADMIN user")
        void register_ShouldThrowException_WhenRoleIsAdmin() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("admin@example.com");
            request.setRole(Role.ADMIN);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cannot create ADMIN users");
        }

        @Test
        @DisplayName("Should use default role when role is null")
        void register_ShouldUseDefaultRole_WhenRoleIsNull() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("noRoleUser@example.com");
            request.setRole(null);

            when(userRepository.findByEmail("noRoleUser@example.com".toLowerCase()))
                    .thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");
            when(twoFactorAuthService.generateSecret()).thenReturn("secret");

            // Act
            authService.register(request);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getRole()).isEqualTo(Role.STORE_EMPLOYEE);
        }
    }

    // ========== LoginWithOtp Tests ==========

    @Nested
    @DisplayName("loginWithOtp() Tests")
    class LoginWithOtpTests {

        @Test
        @DisplayName("Should login successfully with valid OTP")
        void loginWithOtp_ShouldReturnToken_WhenOtpIsValid() {
            // Arrange
            User user = createUser();
            user.setTempCodeUsed(false);
            user.setTempCodeHash("hashedCode");
            user.setTempCodeExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));

            OtpLoginRequest request = new OtpLoginRequest();
            request.setEmail("test@example.com");
            request.setCode("123456");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("123456", "hashedCode")).thenReturn(true);
            when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");

            // Act
            AuthResponse response = authService.loginWithOtp(request);

            // Assert
            assertThat(response.token()).isEqualTo("jwt-token");
            assertThat(user.isTempCodeUsed()).isTrue();
            assertThat(user.getTempCodeHash()).isNull();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw exception when OTP is already used")
        void loginWithOtp_ShouldThrowException_WhenOtpAlreadyUsed() {
            // Arrange
            User user = createUser();
            user.setTempCodeUsed(true);

            OtpLoginRequest request = new OtpLoginRequest();
            request.setEmail("test@example.com");
            request.setCode("123456");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> authService.loginWithOtp(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Code already used");
        }

        @Test
        @DisplayName("Should throw exception when OTP is expired")
        void loginWithOtp_ShouldThrowException_WhenOtpExpired() {
            // Arrange
            User user = createUser();
            user.setTempCodeUsed(false);
            user.setTempCodeExpiresAt(Instant.now().minus(5, ChronoUnit.MINUTES));

            OtpLoginRequest request = new OtpLoginRequest();
            request.setEmail("test@example.com");
            request.setCode("123456");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> authService.loginWithOtp(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Code expired");
        }

        @Test
        @DisplayName("Should throw exception when OTP is invalid")
        void loginWithOtp_ShouldThrowException_WhenOtpIsInvalid() {
            // Arrange
            User user = createUser();
            user.setTempCodeUsed(false);
            user.setTempCodeHash("hashedCode");
            user.setTempCodeExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));

            OtpLoginRequest request = new OtpLoginRequest();
            request.setEmail("test@example.com");
            request.setCode("wrong");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "hashedCode")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.loginWithOtp(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid code or email");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void loginWithOtp_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            OtpLoginRequest request = new OtpLoginRequest();
            request.setEmail("nonexistent@example.com");
            request.setCode("123456");

            when(userRepository.findByEmail("nonexistent@example.com"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.loginWithOtp(request))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ========== UpdatePassword Tests ==========

    @Nested
    @DisplayName("updatePassword() Tests")
    class UpdatePasswordTests {

        @Test
        @DisplayName("Should update password successfully")
        void updatePassword_ShouldUpdatePassword_WhenOldPasswordIsCorrect() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(false);

            PasswordUpdateRequest request = new PasswordUpdateRequest();
            request.setOldPassword("oldPassword");
            request.setNewPassword("newPassword");

            when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);
            when(passwordEncoder.encode("newPassword")).thenReturn("newEncodedPassword");

            // Act
            boolean result = authService.updatePassword(user, request);

            // Assert
            assertThat(result).isTrue();
            assertThat(user.getPassword()).isEqualTo("newEncodedPassword");
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw exception when old password is wrong")
        void updatePassword_ShouldThrowException_WhenOldPasswordIsWrong() {
            // Arrange
            User user = createUser();

            PasswordUpdateRequest request = new PasswordUpdateRequest();
            request.setOldPassword("wrongPassword");
            request.setNewPassword("newPassword");

            when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.updatePassword(user, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Mevcut şifre hatalı");
        }

        @Test
        @DisplayName("Should require 2FA code when TOTP is enabled")
        void updatePassword_ShouldRequire2FA_WhenTotpEnabled() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true);

            PasswordUpdateRequest request = new PasswordUpdateRequest();
            request.setOldPassword("oldPassword");
            request.setNewPassword("newPassword");
            request.setTotpCode(null);

            when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.updatePassword(user, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("2FA kodu gerekli");
        }

        @Test
        @DisplayName("Should throw exception when 2FA code is wrong")
        void updatePassword_ShouldThrowException_When2FACodeIsWrong() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true);

            PasswordUpdateRequest request = new PasswordUpdateRequest();
            request.setOldPassword("oldPassword");
            request.setNewPassword("newPassword");
            request.setTotpCode("123456");

            when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);
            when(twoFactorAuthService.verifyCode("test@example.com", 123456)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.updatePassword(user, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("2FA kodu hatalı");
        }

        @Test
        @DisplayName("Should update password when 2FA code is correct")
        void updatePassword_ShouldUpdate_When2FACodeIsCorrect() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true);

            PasswordUpdateRequest request = new PasswordUpdateRequest();
            request.setOldPassword("oldPassword");
            request.setNewPassword("newPassword");
            request.setTotpCode("123456");

            when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);
            when(twoFactorAuthService.verifyCode("test@example.com", 123456)).thenReturn(true);
            when(passwordEncoder.encode("newPassword")).thenReturn("newEncoded");

            // Act
            boolean result = authService.updatePassword(user, request);

            // Assert
            assertThat(result).isTrue();
            verify(userRepository).save(user);
        }
    }

    // ========== GetByEmail Tests ==========

    @Nested
    @DisplayName("getByEmail() Tests")
    class GetByEmailTests {

        @Test
        @DisplayName("Should return user when email exists")
        void getByEmail_ShouldReturnUser_WhenEmailExists() {
            // Arrange
            User user = createUser();
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

            // Act
            User result = authService.getByEmail("test@example.com");

            // Assert
            assertThat(result).isEqualTo(user);
        }

        @Test
        @DisplayName("Should throw exception when email not found")
        void getByEmail_ShouldThrowException_WhenEmailNotFound() {
            // Arrange
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.getByEmail("unknown@example.com"))
                    .isInstanceOf(ApiException.class);
        }
    }

    // ========== SendResetCode Tests ==========

    @Nested
    @DisplayName("sendResetCode() Tests")
    class SendResetCodeTests {

        @Test
        @DisplayName("Should send reset code when email exists")
        void sendResetCode_ShouldSendCode_WhenEmailExists() {
            // Arrange
            User user = createUser();
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("TEST@EXAMPLE.COM");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");

            // Act
            boolean result = authService.sendResetCode(request);

            // Assert
            assertThat(result).isTrue();
            verify(notificationService).sendOtpEmail(eq("test@example.com"), anyString());
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw silently when email does not exist")
        void sendResetCode_ShouldThrow_WhenEmailNotFound() {
            // Arrange
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("unknown@example.com");

            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // Act & Assert - throws but with generic message for security
            assertThatThrownBy(() -> authService.sendResetCode(request))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ========== Verify2FA Tests ==========

    @Nested
    @DisplayName("verify2FA() Tests")
    class Verify2FATests {

        @Test
        @DisplayName("Should return token when 2FA code is valid")
        void verify2FA_ShouldReturnToken_WhenCodeIsValid() {
            // Arrange
            User user = createUser();
            TwoFactorVerifyRequest request = new TwoFactorVerifyRequest();
            request.setEmail("test@example.com");
            request.setCode("123456");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(twoFactorAuthService.verifyCode("test@example.com", 123456)).thenReturn(true);
            when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");

            // Act
            AuthResponse response = authService.verify2FA(request);

            // Assert
            assertThat(response.token()).isEqualTo("jwt-token");
            assertThat(response.user().getEmail()).isEqualTo("test@example.com");
        }

        @Test
        @DisplayName("Should throw exception when 2FA code is invalid")
        void verify2FA_ShouldThrowException_WhenCodeIsInvalid() {
            // Arrange
            User user = createUser();
            TwoFactorVerifyRequest request = new TwoFactorVerifyRequest();
            request.setEmail("test@example.com");
            request.setCode("000000");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(twoFactorAuthService.verifyCode("test@example.com", 0)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.verify2FA(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid verification code");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void verify2FA_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            TwoFactorVerifyRequest request = new TwoFactorVerifyRequest();
            request.setEmail("unknown@example.com");
            request.setCode("123456");

            when(userRepository.findByEmailAndDeletedFalse("unknown@example.com"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.verify2FA(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== CompleteSetup Tests ==========

    @Nested
    @DisplayName("completeSetup() Tests")
    class CompleteSetupTests {

        @Test
        @DisplayName("Should complete setup and return token")
        void completeSetup_ShouldCompleteSetup_WhenCodeIsValid() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSecret("secret");
            user.setTotpSetupCompleted(false);

            TwoFactorVerifyRequest request = new TwoFactorVerifyRequest();
            request.setEmail("test@example.com");
            request.setCode("123456");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(twoFactorAuthService.verifyCode("test@example.com", 123456)).thenReturn(true);
            when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");

            // Act
            AuthResponse response = authService.completeSetup(request);

            // Assert
            assertThat(response.token()).isEqualTo("jwt-token");
            assertThat(user.isTotpSetupCompleted()).isTrue();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw exception when 2FA is not enabled")
        void completeSetup_ShouldThrowException_When2FANotEnabled() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(false);

            TwoFactorVerifyRequest request = new TwoFactorVerifyRequest();
            request.setEmail("test@example.com");
            request.setCode("123456");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> authService.completeSetup(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("2FA is not enabled");
        }

        @Test
        @DisplayName("Should throw exception when code is invalid")
        void completeSetup_ShouldThrowException_WhenCodeIsInvalid() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSecret("secret");

            TwoFactorVerifyRequest request = new TwoFactorVerifyRequest();
            request.setEmail("test@example.com");
            request.setCode("000000");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(twoFactorAuthService.verifyCode("test@example.com", 0)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.completeSetup(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid 2FA code");
        }
    }

    // ========== Reauthenticate Tests ==========

    @Nested
    @DisplayName("reauthenticate() Tests")
    class ReauthenticateTests {

        @Test
        @DisplayName("Should return token when credentials are valid")
        void reauthenticate_ShouldReturnToken_WhenCredentialsAreValid() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(false);

            ReauthRequest request = new ReauthRequest();
            request.setEmail("test@example.com");
            request.setPassword("password");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
            when(jwtTokenProvider.generateToken(user)).thenReturn("new-jwt-token");

            // Act
            AuthResponse response = authService.reauthenticate(request);

            // Assert
            assertThat(response.token()).isEqualTo("new-jwt-token");
        }

        @Test
        @DisplayName("Should throw exception when password is wrong")
        void reauthenticate_ShouldThrowException_WhenPasswordIsWrong() {
            // Arrange
            User user = createUser();

            ReauthRequest request = new ReauthRequest();
            request.setEmail("test@example.com");
            request.setPassword("wrongPassword");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.reauthenticate(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Şifre hatalı");
        }

        @Test
        @DisplayName("Should throw exception when user is inactive")
        void reauthenticate_ShouldThrowException_WhenUserIsInactive() {
            // Arrange
            User user = createUser();
            user.setActive(false);

            ReauthRequest request = new ReauthRequest();
            request.setEmail("test@example.com");
            request.setPassword("password");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.reauthenticate(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Hesabınız devre dışı");
        }

        @Test
        @DisplayName("Should require 2FA when TOTP enabled and no code provided")
        void reauthenticate_ShouldRequire2FA_WhenTotpEnabledAndNoCode() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true);

            ReauthRequest request = new ReauthRequest();
            request.setEmail("test@example.com");
            request.setPassword("password");
            request.setTwoFactorCode(null);

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);

            // Act
            AuthResponse response = authService.reauthenticate(request);

            // Assert
            assertThat(response.requiresTwoFactor()).isTrue();
            assertThat(response.token()).isNull();
        }

        @Test
        @DisplayName("Should return token when 2FA code is valid")
        void reauthenticate_ShouldReturnToken_When2FACodeIsValid() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true);

            ReauthRequest request = new ReauthRequest();
            request.setEmail("test@example.com");
            request.setPassword("password");
            request.setTwoFactorCode("123456");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
            when(twoFactorAuthService.verifyCode("test@example.com", 123456)).thenReturn(true);
            when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");

            // Act
            AuthResponse response = authService.reauthenticate(request);

            // Assert
            assertThat(response.token()).isEqualTo("jwt-token");
        }

        @Test
        @DisplayName("Should throw exception when 2FA code is wrong")
        void reauthenticate_ShouldThrowException_When2FACodeIsWrong() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true);

            ReauthRequest request = new ReauthRequest();
            request.setEmail("test@example.com");
            request.setPassword("password");
            request.setTwoFactorCode("000000");

            when(userRepository.findByEmailAndDeletedFalse("test@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
            when(twoFactorAuthService.verifyCode("test@example.com", 0)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.reauthenticate(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("2FA kodu hatalı");
        }
    }
}
