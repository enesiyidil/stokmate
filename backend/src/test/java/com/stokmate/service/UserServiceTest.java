package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Role;
import com.stokmate.domain.User;
import com.stokmate.dto.user.*;
import com.stokmate.exception.BadRequestException;
import com.stokmate.mapper.UserMapper;
import com.stokmate.repository.UserRepository;

import java.time.Instant;
import java.util.List;
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
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserMapper userMapper;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                passwordEncoder,
                notificationService,
                userMapper);
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
        user.setDeleted(false);
        user.setTotpEnabled(false);
        return user;
    }

    // ========== GetUserById Tests ==========

    @Nested
    @DisplayName("getUserById() Tests")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return user when ID exists")
        void getUserById_ShouldReturnUser_WhenIdExists() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            User result = userService.getUserById(userId);

            // Assert
            assertThat(result).isEqualTo(user);
            assertThat(result.getId()).isEqualTo(userId);
        }

        @Test
        @DisplayName("Should throw exception when ID not found")
        void getUserById_ShouldThrowException_WhenIdNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.getUserById(userId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== GetProfile Tests ==========

    @Nested
    @DisplayName("getProfile() Tests")
    class GetProfileTests {

        @Test
        @DisplayName("Should return profile response")
        void getProfile_ShouldReturnProfileResponse() {
            // Arrange
            User user = createUser();

            // Act
            UserProfileResponse result = userService.getProfile(user);

            // Assert
            assertThat(result.getEmail()).isEqualTo("test@example.com");
            assertThat(result.getFirstName()).isEqualTo("Test");
            assertThat(result.getLastName()).isEqualTo("User");
        }
    }

    // ========== UpdateProfile Tests ==========

    @Nested
    @DisplayName("updateProfile() Tests")
    class UpdateProfileTests {

        @Test
        @DisplayName("Should update profile fields")
        void updateProfile_ShouldUpdateFields_WhenProvided() {
            // Arrange
            User user = createUser();
            UserProfileUpdateRequest request = new UserProfileUpdateRequest();
            request.setFirstName("NewFirst");
            request.setLastName("NewLast");
            request.setPhone("1234567890");
            request.setAddress("New Address");

            // Act
            UserProfileResponse result = userService.updateProfile(user, request);

            // Assert
            assertThat(user.getFirstName()).isEqualTo("NewFirst");
            assertThat(user.getLastName()).isEqualTo("NewLast");
            assertThat(user.getPhone()).isEqualTo("1234567890");
            assertThat(user.getAddress()).isEqualTo("New Address");
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should only update non-empty fields")
        void updateProfile_ShouldOnlyUpdateNonEmptyFields() {
            // Arrange
            User user = createUser();
            user.setFirstName("Original");
            user.setLastName("Name");

            UserProfileUpdateRequest request = new UserProfileUpdateRequest();
            request.setFirstName("Updated");
            request.setLastName(""); // Empty should not update

            // Act
            userService.updateProfile(user, request);

            // Assert
            assertThat(user.getFirstName()).isEqualTo("Updated");
            assertThat(user.getLastName()).isEqualTo("Name"); // Should remain unchanged
        }
    }

    // ========== GetAllUsers Tests ==========

    @Nested
    @DisplayName("getAllUsers() Tests")
    class GetAllUsersTests {

        @Test
        @DisplayName("Should return all users")
        void getAllUsers_ShouldReturnAllUsers() {
            // Arrange
            User user1 = createUser();
            User user2 = createUser();
            user2.setEmail("user2@example.com");
            when(userRepository.findAll()).thenReturn(List.of(user1, user2));

            // Act
            List<UserResponse> result = userService.getAllUsers();

            // Assert
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Should return empty list when no users")
        void getAllUsers_ShouldReturnEmptyList_WhenNoUsers() {
            // Arrange
            when(userRepository.findAll()).thenReturn(List.of());

            // Act
            List<UserResponse> result = userService.getAllUsers();

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== CreateUser Tests ==========

    @Nested
    @DisplayName("createUser() Tests")
    class CreateUserTests {

        @Test
        @DisplayName("Should create user successfully")
        void createUser_ShouldCreateUser_WhenEmailNotExists() {
            // Arrange
            CreateUserRequest request = new CreateUserRequest();
            request.setEmail("NEW@EXAMPLE.COM");
            request.setRole(Role.STORE_MANAGER);

            when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");

            // Act
            UserResponse result = userService.createUser(request);

            // Assert
            assertThat(result.getEmail()).isEqualTo("new@example.com");
            assertThat(result.getRole()).isEqualTo(Role.STORE_MANAGER);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.isActive()).isTrue();
            assertThat(savedUser.isTempCodeUsed()).isFalse();
            assertThat(savedUser.getTempCodeExpiresAt()).isNotNull();

            verify(notificationService).sendOtpEmail(eq("new@example.com"), anyString());
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void createUser_ShouldThrowException_WhenEmailExists() {
            // Arrange
            CreateUserRequest request = new CreateUserRequest();
            request.setEmail("existing@example.com");

            when(userRepository.findByEmail("existing@example.com"))
                    .thenReturn(Optional.of(createUser()));

            // Act & Assert
            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Email already in use");
        }

        @Test
        @DisplayName("Should convert email to lowercase")
        void createUser_ShouldConvertEmailToLowercase() {
            // Arrange
            CreateUserRequest request = new CreateUserRequest();
            request.setEmail("UpperCase@Example.COM");
            request.setRole(Role.STORE_EMPLOYEE);

            when(userRepository.findByEmail("uppercase@example.com")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");

            // Act
            userService.createUser(request);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getEmail()).isEqualTo("uppercase@example.com");
        }
    }

    // ========== DeleteUser Tests ==========

    @Nested
    @DisplayName("deleteUser() Tests")
    class DeleteUserTests {

        @Test
        @DisplayName("Should delete user when exists")
        void deleteUser_ShouldDeleteUser_WhenExists() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            userService.deleteUser(userId);

            // Assert
            verify(userRepository).delete(user);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void deleteUser_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.deleteUser(userId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== UpdateUserRole Tests ==========

    @Nested
    @DisplayName("updateUserRole() Tests")
    class UpdateUserRoleTests {

        @Test
        @DisplayName("Should update user role")
        void updateUserRole_ShouldUpdateRole() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setRole(Role.STORE_EMPLOYEE);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            UserResponse result = userService.updateUserRole(userId, Role.STORE_MANAGER);

            // Assert
            assertThat(user.getRole()).isEqualTo(Role.STORE_MANAGER);
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void updateUserRole_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.updateUserRole(userId, Role.ADMIN))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ========== ToggleUserActive Tests ==========

    @Nested
    @DisplayName("toggleUserActive() Tests")
    class ToggleUserActiveTests {

        @Test
        @DisplayName("Should activate user")
        void toggleUserActive_ShouldActivateUser() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setActive(false);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            UserResponse result = userService.toggleUserActive(userId, true);

            // Assert
            assertThat(user.isActive()).isTrue();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should deactivate user")
        void toggleUserActive_ShouldDeactivateUser() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setActive(true);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            UserResponse result = userService.toggleUserActive(userId, false);

            // Assert
            assertThat(user.isActive()).isFalse();
            verify(userRepository).save(user);
        }
    }

    // ========== SoftDeleteUser Tests ==========

    @Nested
    @DisplayName("softDeleteUser() Tests")
    class SoftDeleteUserTests {

        @Test
        @DisplayName("Should soft delete user with alias")
        void softDeleteUser_ShouldSetDeletedAndAlias() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setDeleted(false);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(userRepository.findByDeletedAlias("Eski Çalışan")).thenReturn(Optional.empty());

            // Act
            userService.softDeleteUser(userId, "Eski Çalışan");

            // Assert
            assertThat(user.isDeleted()).isTrue();
            assertThat(user.getDeletedAlias()).isEqualTo("Eski Çalışan");
            assertThat(user.getDeletionDate()).isNotNull();
            assertThat(user.isActive()).isFalse();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should throw exception when user already deleted")
        void softDeleteUser_ShouldThrowException_WhenAlreadyDeleted() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setDeleted(true);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> userService.softDeleteUser(userId, "Alias"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already deleted");
        }

        @Test
        @DisplayName("Should throw exception when alias already exists")
        void softDeleteUser_ShouldThrowException_WhenAliasExists() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setDeleted(false);
            User existingUser = createUser();
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(userRepository.findByDeletedAlias("ExistingAlias")).thenReturn(Optional.of(existingUser));

            // Act & Assert
            assertThatThrownBy(() -> userService.softDeleteUser(userId, "ExistingAlias"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Alias already exists");
        }
    }

    // ========== Toggle2FA Tests ==========

    @Nested
    @DisplayName("toggle2FA() Tests")
    class Toggle2FATests {

        @Test
        @DisplayName("Should enable 2FA")
        void toggle2FA_ShouldEnable2FA() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setTotpEnabled(false);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            UserResponse result = userService.toggle2FA(userId, true);

            // Assert
            assertThat(user.isTotpEnabled()).isTrue();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Should disable 2FA and reset secret")
        void toggle2FA_ShouldDisable2FAAndResetSecret() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setTotpEnabled(true);
            user.setTotpSecret("secret");
            user.setTotpSetupCompleted(true);
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            // Act
            UserResponse result = userService.toggle2FA(userId, false);

            // Assert
            assertThat(user.isTotpEnabled()).isFalse();
            assertThat(user.getTotpSecret()).isNull();
            assertThat(user.isTotpSetupCompleted()).isFalse();
            verify(userRepository).save(user);
        }
    }

    // ========== GetUserDisplayName Tests ==========

    @Nested
    @DisplayName("getUserDisplayName() Tests")
    class GetUserDisplayNameTests {

        @Test
        @DisplayName("Should return full name when available")
        void getUserDisplayName_ShouldReturnFullName() {
            // Arrange
            User user = createUser();
            user.setFirstName("John");
            user.setLastName("Doe");

            // Act
            String result = userService.getUserDisplayName(user);

            // Assert
            assertThat(result).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should return alias when user is deleted")
        void getUserDisplayName_ShouldReturnAlias_WhenDeleted() {
            // Arrange
            User user = createUser();
            user.setDeleted(true);
            user.setDeletedAlias("Eski Çalışan");

            // Act
            String result = userService.getUserDisplayName(user);

            // Assert
            assertThat(result).isEqualTo("Eski Çalışan");
        }

        @Test
        @DisplayName("Should return email prefix when no name")
        void getUserDisplayName_ShouldReturnEmailPrefix_WhenNoName() {
            // Arrange
            User user = createUser();
            user.setFirstName(null);
            user.setLastName(null);
            user.setEmail("john.doe@example.com");

            // Act
            String result = userService.getUserDisplayName(user);

            // Assert
            assertThat(result).isEqualTo("john.doe");
        }

        @Test
        @DisplayName("Should return Unknown User when no data")
        void getUserDisplayName_ShouldReturnUnknown_WhenNoData() {
            // Arrange
            User user = new User();
            user.setFirstName(null);
            user.setLastName(null);
            user.setEmail(null);

            // Act
            String result = userService.getUserDisplayName(user);

            // Assert
            assertThat(result).isEqualTo("Unknown User");
        }
    }

    // ========== GetUserSummaries Tests ==========

    @Nested
    @DisplayName("getUserSummaries() Tests")
    class GetUserSummariesTests {

        @Test
        @DisplayName("Should return user summaries")
        void getUserSummaries_ShouldReturnSummaries() {
            // Arrange
            User user1 = createUser();
            User user2 = createUser();
            UserSummaryResponse summary1 = new UserSummaryResponse();
            UserSummaryResponse summary2 = new UserSummaryResponse();

            when(userRepository.findAll()).thenReturn(List.of(user1, user2));
            when(userMapper.toSummaryResponse(user1)).thenReturn(summary1);
            when(userMapper.toSummaryResponse(user2)).thenReturn(summary2);

            // Act
            List<UserSummaryResponse> result = userService.getUserSummaries();

            // Assert
            assertThat(result).hasSize(2);
        }
    }

    // ========== GetSalesConsultants Tests ==========

    @Nested
    @DisplayName("getSalesConsultants() Tests")
    class GetSalesConsultantsTests {

        @Test
        @DisplayName("Should return only store employees")
        void getSalesConsultants_ShouldReturnOnlyStoreEmployees() {
            // Arrange
            User storeEmployee = createUser();
            storeEmployee.setRole(Role.STORE_EMPLOYEE);
            storeEmployee.setLocation("Istanbul");

            User manager = createUser();
            manager.setRole(Role.MANAGER);

            when(userRepository.findAll()).thenReturn(List.of(storeEmployee, manager));

            // Act
            List<SalesConsultantResponse> result = userService.getSalesConsultants(null, null, null);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should filter by location")
        void getSalesConsultants_ShouldFilterByLocation() {
            // Arrange
            User user1 = createUser();
            user1.setRole(Role.STORE_EMPLOYEE);
            user1.setLocation("Istanbul");

            User user2 = createUser();
            user2.setRole(Role.STORE_EMPLOYEE);
            user2.setLocation("Ankara");

            when(userRepository.findAll()).thenReturn(List.of(user1, user2));

            // Act
            List<SalesConsultantResponse> result = userService.getSalesConsultants("Istanbul", null, null);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLocation()).isEqualTo("Istanbul");
        }

        @Test
        @DisplayName("Should filter by search term")
        void getSalesConsultants_ShouldFilterBySearch() {
            // Arrange
            User user1 = createUser();
            user1.setRole(Role.STORE_EMPLOYEE);
            user1.setFirstName("John");

            User user2 = createUser();
            user2.setRole(Role.STORE_EMPLOYEE);
            user2.setFirstName("Jane");

            when(userRepository.findAll()).thenReturn(List.of(user1, user2));

            // Act
            List<SalesConsultantResponse> result = userService.getSalesConsultants(null, null, "John");

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should exclude deleted users")
        void getSalesConsultants_ShouldExcludeDeletedUsers() {
            // Arrange
            User activeUser = createUser();
            activeUser.setRole(Role.STORE_EMPLOYEE);
            activeUser.setDeleted(false);

            User deletedUser = createUser();
            deletedUser.setRole(Role.STORE_EMPLOYEE);
            deletedUser.setDeleted(true);

            when(userRepository.findAll()).thenReturn(List.of(activeUser, deletedUser));

            // Act
            List<SalesConsultantResponse> result = userService.getSalesConsultants(null, null, null);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should exclude inactive users")
        void getSalesConsultants_ShouldExcludeInactiveUsers() {
            // Arrange
            User activeUser = createUser();
            activeUser.setRole(Role.STORE_EMPLOYEE);
            activeUser.setActive(true);

            User inactiveUser = createUser();
            inactiveUser.setRole(Role.STORE_EMPLOYEE);
            inactiveUser.setActive(false);

            when(userRepository.findAll()).thenReturn(List.of(activeUser, inactiveUser));

            // Act
            List<SalesConsultantResponse> result = userService.getSalesConsultants(null, null, null);

            // Assert
            assertThat(result).hasSize(1);
        }
    }

    // ========== UpdateProfileWithPassword Tests ==========

    @Nested
    @DisplayName("updateProfileWithPassword() Tests")
    class UpdateProfileWithPasswordTests {

        @Test
        @DisplayName("Should update profile and password")
        void updateProfileWithPassword_ShouldUpdateProfileAndPassword() {
            // Arrange
            User user = createUser();
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFirstName("NewFirst");
            request.setLastName("NewLast");
            request.setPhone("1234567890");
            request.setAddress("New Address");
            request.setPassword("newPassword");

            when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");

            // Act
            UserResponse result = userService.updateProfileWithPassword(user, request);

            // Assert
            assertThat(user.getFirstName()).isEqualTo("NewFirst");
            assertThat(user.getLastName()).isEqualTo("NewLast");
            assertThat(user.getPassword()).isEqualTo("encodedNewPassword");
            verify(userRepository).save(user);
        }
    }
}
