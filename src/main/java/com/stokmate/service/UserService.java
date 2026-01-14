package com.stokmate.service;

import com.stokmate.domain.User;
import com.stokmate.dto.user.CreateUserRequest;
import com.stokmate.dto.user.UpdateProfileRequest;
import com.stokmate.dto.user.UserProfileResponse;
import com.stokmate.dto.user.UserProfileUpdateRequest;
import com.stokmate.dto.user.UserResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final com.stokmate.mapper.UserMapper userMapper;

    public UserProfileResponse getProfile(User user) {
        return toResponse(user);
    }

    public UserProfileResponse updateProfile(User user, UserProfileUpdateRequest request) {
        if (StringUtils.hasText(request.getFirstName())) {
            user.setFirstName(request.getFirstName());
        }
        if (StringUtils.hasText(request.getLastName())) {
            user.setLastName(request.getLastName());
        }
        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone());
        }
        if (StringUtils.hasText(request.getAddress())) {
            user.setAddress(request.getAddress());
        }
        userRepository.save(user);
        return toResponse(user);
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .displayName(getUserDisplayName(user))
                .build();
    }

    // Admin user management methods

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // Check if email already exists
        userRepository.findByEmail(request.getEmail().toLowerCase())
                .ifPresent(u -> {
                    throw new BadRequestException("Email already in use");
                });

        // Generate OTP
        String otp = generateOtp();

        // Create user
        User user = new User();
        user.setEmail(request.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(otp)); // temporary password
        user.setRole(request.getRole());
        user.setActive(true);
        user.setTempCodeHash(passwordEncoder.encode(otp));
        user.setTempCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        user.setTempCodeUsed(false);

        userRepository.save(user);

        // Send OTP email
        notificationService.sendOtpEmail(user.getEmail(), otp);

        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfileWithPassword(User user, UpdateProfileRequest request) {
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return toUserResponse(user);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        userRepository.delete(user);
    }

    // New user management methods

    @Transactional
    public UserResponse updateUserRole(UUID userId, com.stokmate.domain.Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setRole(newRole);
        userRepository.save(user);

        return toUserResponse(user);
    }

    @Transactional
    public UserResponse toggleUserActive(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setActive(active);
        userRepository.save(user);

        return toUserResponse(user);
    }

    @Transactional
    public void softDeleteUser(UUID userId, String alias) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.isDeleted()) {
            throw new BadRequestException("User is already deleted");
        }

        // Check if alias is unique
        userRepository.findByDeletedAlias(alias).ifPresent(u -> {
            throw new BadRequestException("Alias already exists");
        });

        user.setDeleted(true);
        user.setDeletedAlias(alias);
        user.setDeletionDate(Instant.now());
        user.setActive(false); // Deactivate user

        userRepository.save(user);
    }

    @Transactional
    public UserResponse toggle2FA(UUID userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setTotpEnabled(enabled);
        // If disabling 2FA, also reset the setup flags
        if (!enabled) {
            user.setTotpSecret(null);
            user.setTotpSetupCompleted(false);
        }
        userRepository.save(user);

        return toUserResponse(user);
    }

    public String getUserDisplayName(User user) {
        if (user.isDeleted() && user.getDeletedAlias() != null) {
            return user.getDeletedAlias();
        }
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        }
        if (user.getEmail() != null) {
            return user.getEmail().split("@")[0];
        }
        return "Unknown User";
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .active(user.isActive())
                .deleted(user.isDeleted())
                .deletedAlias(user.getDeletedAlias())
                .displayName(getUserDisplayName(user))
                .totpEnabled(user.isTotpEnabled())
                .build();
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    // User Summary for optimized filtering
    public List<com.stokmate.dto.user.UserSummaryResponse> getUserSummaries() {
        return userRepository.findAll().stream()
                .map(userMapper::toSummaryResponse)
                .collect(Collectors.toList());
    }

    // Sales consultant filtering
    public List<com.stokmate.dto.user.SalesConsultantResponse> getSalesConsultants(
            String location, String department, String search) {

        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == com.stokmate.domain.Role.STORE_EMPLOYEE)
                .filter(user -> user.isActive())
                .filter(user -> !user.isDeleted()) // Exclude deleted users
                .filter(user -> location == null || location.isEmpty() ||
                        (user.getLocation() != null && user.getLocation().contains(location)))
                .filter(user -> department == null || department.isEmpty() ||
                        (user.getDepartment() != null && user.getDepartment().contains(department)))
                .filter(user -> search == null || search.isEmpty() ||
                        (user.getFirstName() != null
                                && user.getFirstName().toLowerCase().contains(search.toLowerCase()))
                        ||
                        (user.getLastName() != null && user.getLastName().toLowerCase().contains(search.toLowerCase()))
                        ||
                        (user.getEmail() != null && user.getEmail().toLowerCase().contains(search.toLowerCase())))
                .map(user -> com.stokmate.dto.user.SalesConsultantResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .fullName(getUserDisplayName(user))
                        .location(user.getLocation())
                        .department(user.getDepartment())
                        .role(user.getRole())
                        .active(user.isActive())
                        .build())
                .collect(Collectors.toList());
    }
}
