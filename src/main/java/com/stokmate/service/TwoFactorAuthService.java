package com.stokmate.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.stokmate.domain.User;
import com.stokmate.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TwoFactorAuthService {

    private final UserRepository userRepository;
    private final GoogleAuthenticator googleAuthenticator = new GoogleAuthenticator();

    private static final String ISSUER = "StokMate";

    /**
     * Generate TOTP secret and QR code for a user
     */
    public Map<String, String> setupTwoFactorAuth(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a new secret key
        GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
        String secret = key.getKey();

        // Temporarily store the secret (not enabled yet)
        user.setTotpSecret(secret);
        userRepository.save(user);

        // Generate QR code URL
        String qrCodeUrl = GoogleAuthenticatorQRGenerator.getOtpAuthURL(
                ISSUER,
                user.getEmail(),
                key);

        Map<String, String> response = new HashMap<>();
        response.put("secret", secret);
        response.put("qrCodeUrl", qrCodeUrl);
        response.put("qrCodeImage", generateQRCodeImage(qrCodeUrl));

        return response;
    }

    /**
     * Generate QR code image as Base64 string
     */
    private String generateQRCodeImage(String qrCodeUrl) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrCodeUrl, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] qrCodeBytes = outputStream.toByteArray();

            return "data:image/png;base64," + Base64.getEncoder().encodeToString(qrCodeBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Enable 2FA for a user after verifying the code
     */
    @Transactional
    public boolean enableTwoFactorAuth(UUID userId, int verificationCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTotpSecret() == null) {
            throw new RuntimeException("2FA setup not initiated");
        }

        // Verify the code
        boolean isValid = googleAuthenticator.authorize(user.getTotpSecret(), verificationCode);

        if (isValid) {
            user.setTotpEnabled(true);
            user.setTotpSetupCompleted(true); // Mark setup as completed
            userRepository.save(user);
            return true;
        }

        return false;
    }

    /**
     * Disable 2FA for a user
     */
    @Transactional
    public void disableTwoFactorAuth(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
    }

    /**
     * Verify TOTP code during login
     */
    public boolean verifyCode(String email, int code) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isTotpEnabled() || user.getTotpSecret() == null) {
            throw new RuntimeException("2FA is not enabled for this user");
        }

        return googleAuthenticator.authorize(user.getTotpSecret(), code);
    }

    /**
     * Check if user has 2FA enabled
     */
    public boolean isTwoFactorEnabled(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.isTotpEnabled();
    }

    /**
     * Check if user has 2FA enabled by email
     */
    public boolean isTwoFactorEnabledByEmail(String email) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.isTotpEnabled();
    }

    /**
     * Generate a new TOTP secret
     */
    public String generateSecret() {
        GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
        return key.getKey();
    }

    /**
     * Generate QR code for existing user with secret
     */
    public Map<String, String> generateQRCode(User user) {
        if (user.getTotpSecret() == null) {
            throw new RuntimeException("User has no TOTP secret");
        }

        String qrCodeUrl = GoogleAuthenticatorQRGenerator.getOtpAuthURL(
                ISSUER,
                user.getEmail(),
                new GoogleAuthenticatorKey.Builder(user.getTotpSecret()).build());

        Map<String, String> response = new HashMap<>();
        response.put("secret", user.getTotpSecret());
        response.put("qrCodeUrl", qrCodeUrl);
        response.put("qrCodeImage", generateQRCodeImage(qrCodeUrl));

        return response;
    }

    /**
     * Verify TOTP code for a User entity directly
     * Used for client-side gating of sensitive actions
     */
    public boolean verifyCode(User user, int code) {
        if (!user.isTotpEnabled() || user.getTotpSecret() == null) {
            throw new RuntimeException("2FA is not enabled for this user");
        }
        return googleAuthenticator.authorize(user.getTotpSecret(), code);
    }
}
