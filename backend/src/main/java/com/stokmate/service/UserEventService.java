package com.stokmate.service;

import com.stokmate.domain.Notification;
import com.stokmate.domain.NotificationType;
import com.stokmate.domain.User;
import com.stokmate.domain.UserEvent;
import com.stokmate.dto.event.UserEventRequest;
import com.stokmate.dto.event.UserEventResponse;
import com.stokmate.mapper.UserEventMapper;
import com.stokmate.repository.NotificationRepository;
import com.stokmate.repository.UserEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserEventService {

    private final UserEventRepository userEventRepository;
    private final NotificationRepository notificationRepository;
    private final UserEventMapper userEventMapper;

    @Transactional(readOnly = true)
    public List<UserEventResponse> getUserEvents(User user, LocalDateTime start, LocalDateTime end) {
        return userEventRepository.findByUserAndDateRange(user.getId(), start, end)
                .stream()
                .map(userEventMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserEventResponse createEvent(User user, UserEventRequest request) {
        UserEvent event = userEventMapper.toEntity(request);
        event.setUser(user);
        event.setNotified(false);
        return userEventMapper.toResponse(userEventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(User user, UUID eventId) {
        UserEvent event = userEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }
        userEventRepository.delete(event);
    }

    @Transactional
    public UserEventResponse updateEvent(User user, UUID eventId, UserEventRequest request) {
        UserEvent event = userEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        userEventMapper.updateEntityFromRequest(request, event);
        // Reset notification status if time changed (optional, simplistic approach)
        event.setNotified(false);

        return userEventMapper.toResponse(userEventRepository.save(event));
    }

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void checkReminders() {
        List<UserEvent> potentialReminders = userEventRepository.findPotentialReminders();
        LocalDateTime now = LocalDateTime.now();

        for (UserEvent event : potentialReminders) {
            boolean shouldNotify = false;
            LocalDateTime triggerTime = event.getStartDateTime();

            switch (event.getReminderType()) {
                case AT_TIME_OF_EVENT:
                    shouldNotify = now.isAfter(triggerTime) || now.isEqual(triggerTime);
                    break;
                case MIN_15_BEFORE:
                    shouldNotify = now.isAfter(triggerTime.minusMinutes(15));
                    break;
                case HOUR_1_BEFORE:
                    shouldNotify = now.isAfter(triggerTime.minusHours(1));
                    break;
                case DAY_1_BEFORE:
                    shouldNotify = now.isAfter(triggerTime.minusDays(1));
                    break;
                default:
                    shouldNotify = false;
            }

            if (shouldNotify) {
                // Create Notification
                Notification notification = Notification.builder()
                        .user(event.getUser())
                        .type(NotificationType.REMINDER)
                        .title("Hatırlatma: " + event.getTitle())
                        .message(event.getDescription() != null ? event.getDescription() : "Etkinlik zamanı yaklaştı.")
                        .isRead(false)
                        .build();

                notificationRepository.save(notification);

                // Mark as notified
                event.setNotified(true);
                userEventRepository.save(event);
            }
        }
    }
}
