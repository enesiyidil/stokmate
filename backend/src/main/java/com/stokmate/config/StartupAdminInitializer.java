package com.stokmate.config;

import com.stokmate.domain.Role;
import com.stokmate.domain.User;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class StartupAdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupAdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        boolean adminExists = userRepository.existsByRole(Role.ADMIN);
        if (adminExists) {
            return;
        }
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("Admin user missing and ADMIN_EMAIL/ADMIN_PASSWORD not provided");
            return;
        }
        User admin = new User();
        admin.setEmail(adminEmail.toLowerCase());
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        userRepository.save(admin);
        log.info("Admin user created with email {}", adminEmail);
    }
}
