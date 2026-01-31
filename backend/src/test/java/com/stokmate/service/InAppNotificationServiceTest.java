package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.*;
import com.stokmate.dto.notification.NotificationResponse;
import com.stokmate.repository.NotificationRepository;
import com.stokmate.repository.UserRepository;

import java.time.LocalDateTime;
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

@ExtendWith(MockitoExtension.class)
class InAppNotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private InAppNotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new InAppNotificationService(notificationRepository, userRepository);
    }

    // ========== Helper Methods ==========

    private User createUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.STORE_EMPLOYEE);
        user.setActive(true);
        return user;
    }

    private Notification createNotification(User user) {
        return Notification.builder()
                .id(UUID.randomUUID())
                .user(user)
                .type(NotificationType.ORDER_STATUS_CHANGED)
                .title("Test Notification")
                .message("Test message")
                .linkUrl("/test")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ========== CreateNotification Tests ==========

    @Nested
    @DisplayName("createNotification() Tests")
    class CreateNotificationTests {

        @Test
        @DisplayName("Should create notifications for specified users")
        void createNotification_ShouldCreateForSpecifiedUsers() {
            // Arrange
            User user1 = createUser();
            User user2 = createUser();
            user2.setId(UUID.randomUUID());

            List<UUID> targetUserIds = List.of(user1.getId(), user2.getId());

            when(userRepository.findById(user1.getId())).thenReturn(Optional.of(user1));
            when(userRepository.findById(user2.getId())).thenReturn(Optional.of(user2));

            // Act
            notificationService.createNotification(
                    NotificationType.ORDER_STATUS_CHANGED,
                    "New Order",
                    "A new order has been created",
                    "/orders/123",
                    targetUserIds);

            // Assert
            verify(notificationRepository, times(2)).save(any(Notification.class));
        }

        @Test
        @DisplayName("Should skip non-existent users silently")
        void createNotification_ShouldSkipNonExistentUsers() {
            // Arrange
            User existingUser = createUser();
            UUID nonExistentId = UUID.randomUUID();

            List<UUID> targetUserIds = List.of(existingUser.getId(), nonExistentId);

            when(userRepository.findById(existingUser.getId())).thenReturn(Optional.of(existingUser));
            when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act
            notificationService.createNotification(
                    NotificationType.ORDER_STATUS_CHANGED,
                    "Title",
                    "Message",
                    "/link",
                    targetUserIds);

            // Assert
            verify(notificationRepository, times(1)).save(any(Notification.class));
        }
    }

    // ========== CreateNotificationForRoles Tests ==========

    @Nested
    @DisplayName("createNotificationForRoles() Tests")
    class CreateNotificationForRolesTests {

        @Test
        @DisplayName("Should create notifications for users with specified roles")
        void createNotificationForRoles_ShouldCreateForMatchingRoles() {
            // Arrange
            User admin = createUser();
            admin.setRole(Role.ADMIN);
            admin.setActive(true);

            User manager = createUser();
            manager.setId(UUID.randomUUID());
            manager.setRole(Role.MANAGER);
            manager.setActive(true);

            User employee = createUser();
            employee.setId(UUID.randomUUID());
            employee.setRole(Role.STORE_EMPLOYEE);
            employee.setActive(true);

            when(userRepository.findAll()).thenReturn(List.of(admin, manager, employee));

            // Act
            notificationService.createNotificationForRoles(
                    NotificationType.LOW_STOCK,
                    "Low Stock",
                    "Stock is low",
                    "/products",
                    List.of(Role.ADMIN, Role.MANAGER));

            // Assert
            verify(notificationRepository, times(2)).save(any(Notification.class));
        }

        @Test
        @DisplayName("Should exclude inactive users")
        void createNotificationForRoles_ShouldExcludeInactiveUsers() {
            // Arrange
            User activeAdmin = createUser();
            activeAdmin.setRole(Role.ADMIN);
            activeAdmin.setActive(true);

            User inactiveAdmin = createUser();
            inactiveAdmin.setId(UUID.randomUUID());
            inactiveAdmin.setRole(Role.ADMIN);
            inactiveAdmin.setActive(false);

            when(userRepository.findAll()).thenReturn(List.of(activeAdmin, inactiveAdmin));

            // Act
            notificationService.createNotificationForRoles(
                    NotificationType.ORDER_STATUS_CHANGED,
                    "Title",
                    "Message",
                    "/link",
                    List.of(Role.ADMIN));

            // Assert
            verify(notificationRepository, times(1)).save(any(Notification.class));
        }
    }

    // ========== GetAllNotifications Tests ==========

    @Nested
    @DisplayName("getAllNotifications() Tests")
    class GetAllNotificationsTests {

        @Test
        @DisplayName("Should return all notifications for user")
        void getAllNotifications_ShouldReturnAllNotifications() {
            // Arrange
            User user = createUser();
            Notification notification1 = createNotification(user);
            Notification notification2 = createNotification(user);

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()))
                    .thenReturn(List.of(notification1, notification2));

            // Act
            List<NotificationResponse> result = notificationService.getAllNotifications("user@example.com");

            // Assert
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void getAllNotifications_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> notificationService.getAllNotifications("unknown@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Kullanıcı bulunamadı");
        }
    }

    // ========== GetUnreadNotifications Tests ==========

    @Nested
    @DisplayName("getUnreadNotifications() Tests")
    class GetUnreadNotificationsTests {

        @Test
        @DisplayName("Should return only unread notifications")
        void getUnreadNotifications_ShouldReturnUnread() {
            // Arrange
            User user = createUser();
            Notification unread = createNotification(user);
            unread.setRead(false);

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(notificationRepository.findUnreadByUserId(user.getId()))
                    .thenReturn(List.of(unread));

            // Act
            List<NotificationResponse> result = notificationService.getUnreadNotifications("user@example.com");

            // Assert
            assertThat(result).hasSize(1);
        }
    }

    // ========== GetUnreadCount Tests ==========

    @Nested
    @DisplayName("getUnreadCount() Tests")
    class GetUnreadCountTests {

        @Test
        @DisplayName("Should return unread count")
        void getUnreadCount_ShouldReturnCount() {
            // Arrange
            User user = createUser();

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(notificationRepository.countUnreadByUserId(user.getId())).thenReturn(5L);

            // Act
            long result = notificationService.getUnreadCount("user@example.com");

            // Assert
            assertThat(result).isEqualTo(5);
        }
    }

    // ========== MarkAsRead Tests ==========

    @Nested
    @DisplayName("markAsRead() Tests")
    class MarkAsReadTests {

        @Test
        @DisplayName("Should mark notification as read")
        void markAsRead_ShouldMarkAsRead() {
            // Arrange
            User user = createUser();
            Notification notification = createNotification(user);

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(notificationRepository.findById(notification.getId()))
                    .thenReturn(Optional.of(notification));

            // Act
            notificationService.markAsRead(notification.getId(), "user@example.com");

            // Assert
            assertThat(notification.isRead()).isTrue();
            assertThat(notification.getReadAt()).isNotNull();
            verify(notificationRepository).save(notification);
        }

        @Test
        @DisplayName("Should throw exception when notification not found")
        void markAsRead_ShouldThrowException_WhenNotificationNotFound() {
            // Arrange
            User user = createUser();
            UUID notificationId = UUID.randomUUID();

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> notificationService.markAsRead(notificationId, "user@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Bildirim bulunamadı");
        }

        @Test
        @DisplayName("Should throw exception when notification belongs to another user")
        void markAsRead_ShouldThrowException_WhenNotificationBelongsToAnotherUser() {
            // Arrange
            User currentUser = createUser();
            User otherUser = createUser();
            otherUser.setId(UUID.randomUUID());
            Notification notification = createNotification(otherUser);

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(currentUser));
            when(notificationRepository.findById(notification.getId()))
                    .thenReturn(Optional.of(notification));

            // Act & Assert
            assertThatThrownBy(() -> notificationService.markAsRead(notification.getId(), "user@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Bu bildirime erişim yetkiniz yok");
        }
    }

    // ========== MarkAllAsRead Tests ==========

    @Nested
    @DisplayName("markAllAsRead() Tests")
    class MarkAllAsReadTests {

        @Test
        @DisplayName("Should mark all notifications as read")
        void markAllAsRead_ShouldMarkAll() {
            // Arrange
            User user = createUser();

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

            // Act
            notificationService.markAllAsRead("user@example.com");

            // Assert
            verify(notificationRepository).markAllAsReadByUserId(user.getId());
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void markAllAsRead_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> notificationService.markAllAsRead("unknown@example.com"))
                    .isInstanceOf(RuntimeException.class);
        }
    }
}
