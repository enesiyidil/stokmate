package com.stokmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String email, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("StokMate Giriş Kodu");
            message.setText("Giriş kodunuz: " + code + "\n\nBu kod 15 dakika süreyle geçerlidir.");

            mailSender.send(message);
            log.info("OTP code sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send email to {}", email, e);
            // Don't throw exception to avoid breaking the auth flow if mail fails in dev
        }
    }
}
