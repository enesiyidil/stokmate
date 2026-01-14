package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.repository.NotificationRepository;
import com.stokmate.repository.ShipmentRepository;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShipmentNotificationService {

    private final ShipmentRepository shipmentRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Scheduled(fixedRate = 600000) // Run every 10 minutes
    @Transactional
    public void processShipmentNotifications() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Check for 1 Day Before
        // Window: [Now + 23h, Now + 25h] to catch shipments roughly 1 day away
        LocalDateTime dayStart = now.plusHours(23);
        LocalDateTime dayEnd = now.plusHours(25);

        List<Shipment> dayShipments = shipmentRepository.findByNotified1DayFalseAndPlannedShipmentDateBetween(dayStart,
                dayEnd);
        for (Shipment s : dayShipments) {
            sendNotifications(s, "1 gün", true);
            s.setNotified1Day(true);
            shipmentRepository.save(s);
        }

        // 2. Check for 1 Hour Before
        // Window: [Now + 30m, Now + 1h 30m] to catch shipments roughly 1 hour away
        LocalDateTime hourStart = now.plusMinutes(30);
        LocalDateTime hourEnd = now.plusMinutes(90);

        List<Shipment> hourShipments = shipmentRepository
                .findByNotified1HourFalseAndPlannedShipmentDateBetween(hourStart, hourEnd);
        for (Shipment s : hourShipments) {
            sendNotifications(s, "1 saat", false);
            s.setNotified1Hour(true);
            shipmentRepository.save(s);
        }
    }

    private void sendNotifications(Shipment shipment, String timeLabel, boolean dayBefore) {
        Set<User> recipients = new HashSet<>();

        // 1. Logistics Manager (Always 1d & 1h)
        recipients.addAll(userRepository.findByRole(Role.LOGISTICS_MANAGER));

        // 2. Operations Manager (Always 1d & 1h)
        recipients.addAll(userRepository.findByRole(Role.OPERATIONS_MANAGER));

        // 3. Others (Only for 1 Hour before)
        if (!dayBefore) {
            recipients.addAll(userRepository.findByRole(Role.ADMIN));
            recipients.addAll(userRepository.findByRole(Role.DIRECTOR));
            recipients.addAll(userRepository.findByRole(Role.MANAGER));

            // Store Manager (based on location match)
            if (shipment.getOrder() != null && shipment.getOrder().getSalesConsultant() != null) {
                User consultant = shipment.getOrder().getSalesConsultant();
                if (consultant.getLocation() != null) {
                    recipients
                            .addAll(userRepository.findByRoleAndLocation(Role.STORE_MANAGER, consultant.getLocation()));
                }
                // Store Employee (Consultant)
                recipients.add(consultant);
            } else if (shipment.getSale() != null && shipment.getSale().getSalesConsultant() != null) {
                User consultant = shipment.getSale().getSalesConsultant();
                if (consultant.getLocation() != null) {
                    recipients
                            .addAll(userRepository.findByRoleAndLocation(Role.STORE_MANAGER, consultant.getLocation()));
                }
                // Store Employee (Consultant)
                recipients.add(consultant);
            }
        }

        String title = "Sevk Hatırlatması (" + timeLabel + " kaldı)";
        String message = buildMessage(shipment);

        for (User user : recipients) {
            // Avoid sending to null users or inactive
            if (user == null || !user.isActive() || user.isDeleted())
                continue;

            Notification notification = Notification.builder()
                    .user(user)
                    .type(NotificationType.REMINDER) // Or SHIPMENT_UPDATE
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
        }

        log.info("Sent shipment notifications for Shipment ID {} to {} users ({})", shipment.getId(), recipients.size(),
                timeLabel);
    }

    private String buildMessage(Shipment shipment) {
        StringBuilder sb = new StringBuilder();
        if (shipment.getOrder() != null) {
            sb.append("Sipariş: ").append(shipment.getOrder().getOrderNo());
            if (shipment.getOrder().getCustomer() != null) {
                sb.append(" - ").append(shipment.getOrder().getCustomer().getFirstName());
            }
        } else if (shipment.getSale() != null) {
            sb.append("Satış: ").append(shipment.getSale().getSaleNo());
        }

        sb.append("\nPlanlanan: ").append(shipment.getPlannedShipmentDate());
        if (shipment.getVehicle() != null) {
            sb.append("\nAraç: ").append(shipment.getVehicle().getLicensePlate());
        }

        return sb.toString();
    }
}
