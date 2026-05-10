package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.notification.NotificationResponse;
import com.stokmate.repository.NotificationRepository;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InAppNotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Create notification for specific users
     */
    @Transactional
    public void createNotification(NotificationType type, String title, String message, String linkUrl,
            List<UUID> targetUserIds) {
        for (UUID userId : targetUserIds) {
            userRepository.findById(userId).ifPresent(user -> {
                Notification notification = Notification.builder()
                        .user(user)
                        .type(type)
                        .title(title)
                        .message(message)
                        .linkUrl(linkUrl)
                        .isRead(false)
                        .build();
                notificationRepository.save(notification);
            });
        }
    }

    /**
     * Create notification for users with specific roles
     */
    @Transactional
    public void createNotificationForRoles(NotificationType type, String title, String message, String linkUrl,
            List<Role> targetRoles) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.isActive() && targetRoles.contains(u.getRole()))
                .collect(Collectors.toList());

        for (User user : users) {
            Notification notification = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .linkUrl(linkUrl)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
    }

    public List<NotificationResponse> getAllNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        return notificationRepository.findUnreadByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        return notificationRepository.countUnreadByUserId(user.getId());
    }

    @Transactional
    public void markAsRead(UUID notificationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Bildirim bulunamadı"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bu bildirime erişim yetkiniz yok");
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .linkUrl(n.getLinkUrl())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }
}
