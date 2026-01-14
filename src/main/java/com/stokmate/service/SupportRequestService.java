package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.support.*;
import com.stokmate.repository.SupportRequestRepository;
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
public class SupportRequestService {

    private final SupportRequestRepository supportRequestRepository;
    private final UserRepository userRepository;
    private final InAppNotificationService notificationService;

    @Transactional
    public SupportRequestResponse create(CreateSupportRequestRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        SupportRequest supportRequest = new SupportRequest();
        supportRequest.setTitle(request.getTitle());
        supportRequest.setDescription(request.getDescription());
        supportRequest.setCategory(request.getCategory());
        supportRequest.setPriority(request.getPriority() != null ? request.getPriority() : RequestPriority.MEDIUM);
        supportRequest.setStatus(RequestStatus.OPEN);
        supportRequest.setCreatedBy(user);

        SupportRequest saved = supportRequestRepository.save(supportRequest);

        // Send notification to managers
        notificationService.createNotificationForRoles(
                NotificationType.SUPPORT_REQUEST_CREATED,
                "Yeni Destek Talebi",
                user.getFirstName() + " " + user.getLastName() + " yeni bir talep oluşturdu: " + request.getTitle(),
                "/support-requests",
                List.of(Role.ADMIN, Role.MANAGER, Role.DIRECTOR));

        return toResponse(saved);
    }

    public List<SupportRequestResponse> getMyRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        return supportRequestRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SupportRequestResponse> getAllRequests() {
        return supportRequestRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupportRequestResponse updateStatus(UUID requestId, UpdateSupportRequestRequest request, String userEmail) {
        SupportRequest supportRequest = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Talep bulunamadı"));

        if (request.getStatus() != null) {
            supportRequest.setStatus(request.getStatus());

            if (request.getStatus() == RequestStatus.RESOLVED) {
                supportRequest.setResolvedAt(LocalDateTime.now());
            }
        }

        if (request.getResolution() != null) {
            supportRequest.setResolution(request.getResolution());
        }

        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Atanacak kullanıcı bulunamadı"));
            supportRequest.setAssignedTo(assignee);
        }

        SupportRequest saved = supportRequestRepository.save(supportRequest);

        // Send notification to requester when resolved
        if (request.getStatus() == RequestStatus.RESOLVED) {
            notificationService.createNotification(
                    NotificationType.SUPPORT_REQUEST_RESOLVED,
                    "Talebiniz Çözüldü",
                    "\"" + supportRequest.getTitle() + "\" talebiniz çözüldü.",
                    "/support-requests",
                    List.of(supportRequest.getCreatedBy().getId()));
        }

        return toResponse(saved);
    }

    @Transactional
    public void cancel(UUID requestId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        SupportRequest supportRequest = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Talep bulunamadı"));

        // Only creator can cancel their own request
        if (!supportRequest.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Bu talebi iptal etme yetkiniz yok");
        }

        if (supportRequest.getStatus() == RequestStatus.RESOLVED) {
            throw new RuntimeException("Çözülmüş talepler iptal edilemez");
        }

        supportRequest.setStatus(RequestStatus.CANCELLED);
        supportRequestRepository.save(supportRequest);
    }

    @Transactional
    public void delete(UUID requestId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        SupportRequest supportRequest = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Talep bulunamadı"));

        // Only creator can delete their own request
        if (!supportRequest.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Bu talebi silme yetkiniz yok");
        }

        supportRequestRepository.delete(supportRequest);
    }

    public long countOpenRequests() {
        return supportRequestRepository.countOpenRequests();
    }

    private SupportRequestResponse toResponse(SupportRequest sr) {
        return SupportRequestResponse.builder()
                .id(sr.getId())
                .title(sr.getTitle())
                .description(sr.getDescription())
                .category(sr.getCategory())
                .status(sr.getStatus())
                .priority(sr.getPriority())
                .createdById(sr.getCreatedBy().getId())
                .createdByName(sr.getCreatedBy().getFirstName() + " " + sr.getCreatedBy().getLastName())
                .createdByEmail(sr.getCreatedBy().getEmail())
                .assignedToId(sr.getAssignedTo() != null ? sr.getAssignedTo().getId() : null)
                .assignedToName(sr.getAssignedTo() != null
                        ? sr.getAssignedTo().getFirstName() + " " + sr.getAssignedTo().getLastName()
                        : null)
                .resolution(sr.getResolution())
                .createdAt(sr.getCreatedAt())
                .updatedAt(sr.getUpdatedAt())
                .resolvedAt(sr.getResolvedAt())
                .build();
    }
}
