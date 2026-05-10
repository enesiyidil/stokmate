package com.stokmate.dto.notification;

import com.stokmate.domain.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private String linkUrl;
    private boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
