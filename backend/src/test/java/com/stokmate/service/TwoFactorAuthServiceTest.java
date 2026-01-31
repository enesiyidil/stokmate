package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

import com.stokmate.domain.User;
import com.stokmate.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

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

@ExtendWith(MockitoExtension.class)
class TwoFactorAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private TwoFactorAuthService twoFactorAuthService;

    @BeforeEach
    void setUp() {
        twoFactorAuthService = new TwoFactorAuthService(userRepository);
    }

    // ========== Helper Methods ==========

    private User createUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        user.setTotpSetupCompleted(false);
        return user;
    }

    // ========== SetupTwoFactorAuth Tests ==========

    @Nested
    @DisplayName("setupTwoFactorAuth() Tests")
    class SetupTwoFactorAuthTests {

        @Test
        @DisplayName("Should generate secret and QR code")
        void setupTwoFactorAuth_ShouldGenerateSecretAndQRCode() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            Map<String, String> result = twoFactorAuthService.setupTwoFactorAuth(userId);

            // Assert
            assertThat(result).containsKeys("secret", "qrCodeUrl", "qrCodeImage");
            assertThat(result.get("secret")).isNotEmpty();
            assertThat(result.get("qrCodeImage")).startsWith("data:image/png;base64,");
            verify(userRepository).save(user);
            assertThat(user.getTotpSecret()).isNotNull();
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void setupTwoFactorAuth_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.setupTwoFactorAuth(userId))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== EnableTwoFactorAuth Tests ==========

    @Nested
    @DisplayName("enableTwoFactorAuth() Tests")
    class EnableTwoFactorAuthTests {

        @Test
        @DisplayName("Should throw exception when setup not initiated")
        void enableTwoFactorAuth_ShouldThrowException_WhenNoSecret() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            user.setTotpSecret(null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.enableTwoFactorAuth(userId, 123456))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("2FA setup not initiated");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void enableTwoFactorAuth_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.enableTwoFactorAuth(userId, 123456))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== DisableTwoFactorAuth Tests ==========

    @Nested
    @DisplayName("disableTwoFactorAuth() Tests")
    class DisableTwoFactorAuthTests {

        @Test
        @DisplayName("Should disable 2FA and clear secret")
        void disableTwoFactorAuth_ShouldDisableAndClearSecret() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            user.setTotpEnabled(true);
            user.setTotpSecret("secret");

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            twoFactorAuthService.disableTwoFactorAuth(userId);

            // Assert
            assertThat(user.isTotpEnabled()).isFalse();
            assertThat(user.getTotpSecret()).isNull();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void disableTwoFactorAuth_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.disableTwoFactorAuth(userId))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== VerifyCode (by email) Tests ==========

    @Nested
    @DisplayName("verifyCode(email, code) Tests")
    class VerifyCodeByEmailTests {

        @Test
        @DisplayName("Should throw exception when 2FA not enabled")
        void verifyCode_ShouldThrowException_When2FANotEnabled() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(false);

            when(userRepository.findByEmailAndDeletedFalse("user@example.com"))
                    .thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.verifyCode("user@example.com", 123456))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("2FA is not enabled");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void verifyCode_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            when(userRepository.findByEmailAndDeletedFalse("unknown@example.com"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.verifyCode("unknown@example.com", 123456))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== IsTwoFactorEnabled Tests ==========

    @Nested
    @DisplayName("isTwoFactorEnabled() Tests")
    class IsTwoFactorEnabledTests {

        @Test
        @DisplayName("Should return true when 2FA enabled")
        void isTwoFactorEnabled_ShouldReturnTrue_WhenEnabled() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            user.setTotpEnabled(true);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            boolean result = twoFactorAuthService.isTwoFactorEnabled(userId);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when 2FA disabled")
        void isTwoFactorEnabled_ShouldReturnFalse_WhenDisabled() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            user.setTotpEnabled(false);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            boolean result = twoFactorAuthService.isTwoFactorEnabled(userId);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void isTwoFactorEnabled_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.isTwoFactorEnabled(userId))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== IsTwoFactorEnabledByEmail Tests ==========

    @Nested
    @DisplayName("isTwoFactorEnabledByEmail() Tests")
    class IsTwoFactorEnabledByEmailTests {

        @Test
        @DisplayName("Should return 2FA status by email")
        void isTwoFactorEnabledByEmail_ShouldReturnStatus() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);

            when(userRepository.findByEmailAndDeletedFalse("user@example.com"))
                    .thenReturn(Optional.of(user));

            // Act
            boolean result = twoFactorAuthService.isTwoFactorEnabledByEmail("user@example.com");

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void isTwoFactorEnabledByEmail_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            when(userRepository.findByEmailAndDeletedFalse("unknown@example.com"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.isTwoFactorEnabledByEmail("unknown@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== GenerateSecret Tests ==========

    @Nested
    @DisplayName("generateSecret() Tests")
    class GenerateSecretTests {

        @Test
        @DisplayName("Should generate valid secret")
        void generateSecret_ShouldGenerateValidSecret() {
            // Act
            String secret = twoFactorAuthService.generateSecret();

            // Assert
            assertThat(secret).isNotNull();
            assertThat(secret).isNotEmpty();
        }
    }

    // ========== GenerateQRCode Tests ==========

    @Nested
    @DisplayName("generateQRCode() Tests")
    class GenerateQRCodeTests {

        @Test
        @DisplayName("Should throw exception when user has no secret")
        void generateQRCode_ShouldThrowException_WhenNoSecret() {
            // Arrange
            User user = createUser();
            user.setTotpSecret(null);

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.generateQRCode(user))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User has no TOTP secret");
        }

        @Test
        @DisplayName("Should generate QR code when user has secret")
        void generateQRCode_ShouldGenerateQRCode_WhenSecretExists() {
            // Arrange
            User user = createUser();
            user.setTotpSecret("JBSWY3DPEHPK3PXP"); // Valid base32 secret

            // Act
            Map<String, String> result = twoFactorAuthService.generateQRCode(user);

            // Assert
            assertThat(result).containsKeys("secret", "qrCodeUrl", "qrCodeImage");
            assertThat(result.get("qrCodeImage")).startsWith("data:image/png;base64,");
        }
    }

    // ========== VerifyCode (by User entity) Tests ==========

    @Nested
    @DisplayName("verifyCode(user, code) Tests")
    class VerifyCodeByUserTests {

        @Test
        @DisplayName("Should throw exception when 2FA not enabled")
        void verifyCode_ShouldThrowException_When2FANotEnabled() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(false);

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.verifyCode(user, 123456))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("2FA is not enabled");
        }

        @Test
        @DisplayName("Should throw exception when no secret")
        void verifyCode_ShouldThrowException_WhenNoSecret() {
            // Arrange
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSecret(null);

            // Act & Assert
            assertThatThrownBy(() -> twoFactorAuthService.verifyCode(user, 123456))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("2FA is not enabled");
        }
    }
}
