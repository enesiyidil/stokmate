package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.feedback.*;
import com.stokmate.repository.FeedbackRepository;
import com.stokmate.repository.FeedbackResponseRepository;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackResponseRepository feedbackResponseRepository;
    private final UserRepository userRepository;
    private final InAppNotificationService notificationService;

    @Transactional
    public FeedbackDetailResponse create(CreateFeedbackRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);

        Feedback feedback = new Feedback();
        feedback.setType(request.getType());
        feedback.setTitle(request.getTitle());
        feedback.setDescription(request.getDescription());
        feedback.setPageUrl(request.getPageUrl());
        feedback.setSeverity(request.getSeverity());
        feedback.setRating(request.getRating());
        feedback.setStatus(FeedbackStatus.NEW);
        feedback.setCreatedBy(user);

        Feedback saved = feedbackRepository.save(feedback);

        String userName = buildFullName(user);
        String typeLabel = getTypeLabel(request.getType());

        notificationService.createNotificationForRoles(
                NotificationType.FEEDBACK_CREATED,
                "Yeni Geri Bildirim: " + typeLabel,
                userName + " yeni bir geri bildirim gönderdi: " + request.getTitle(),
                "/feedback",
                List.of(Role.ADMIN, Role.MANAGER, Role.DIRECTOR));

        return toDetailResponse(saved, List.of());
    }

    public List<FeedbackSummaryResponse> getMyFeedbacks(String userEmail) {
        User user = findUserByEmail(userEmail);
        return feedbackRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    public List<FeedbackSummaryResponse> getAllFeedbacks(FeedbackStatus status, FeedbackType type) {
        List<Feedback> feedbacks;
        if (status != null && type != null) {
            feedbacks = feedbackRepository.findByStatusAndTypeOrderByCreatedAtDesc(status, type);
        } else if (status != null) {
            feedbacks = feedbackRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (type != null) {
            feedbacks = feedbackRepository.findByTypeOrderByCreatedAtDesc(type);
        } else {
            feedbacks = feedbackRepository.findAllOrderByCreatedAtDesc();
        }
        return feedbacks.stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    public FeedbackDetailResponse getFeedbackDetail(UUID feedbackId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Feedback feedback = feedbackRepository.findByIdWithCreatedBy(feedbackId)
                .orElseThrow(() -> new RuntimeException("Geri bildirim bulunamadı"));

        boolean isOwner = feedback.getCreatedBy().getId().equals(user.getId());
        boolean isManager = List.of(Role.ADMIN, Role.MANAGER, Role.DIRECTOR).contains(user.getRole());
        if (!isOwner && !isManager) {
            throw new RuntimeException("Bu geri bildirime erişim yetkiniz yok");
        }

        List<FeedbackResponse> responses = feedbackResponseRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId);
        return toDetailResponse(feedback, responses);
    }

    @Transactional
    public FeedbackDetailResponse updateStatus(UUID feedbackId, UpdateFeedbackStatusRequest request, String userEmail) {
        Feedback feedback = feedbackRepository.findByIdWithCreatedBy(feedbackId)
                .orElseThrow(() -> new RuntimeException("Geri bildirim bulunamadı"));

        if (request.getStatus() != null) {
            feedback.setStatus(request.getStatus());
        }
        if (request.getAdminNote() != null) {
            feedback.setAdminNote(request.getAdminNote());
        }

        Feedback saved = feedbackRepository.save(feedback);

        if (request.getStatus() != null) {
            String statusLabel = getStatusLabel(request.getStatus());
            notificationService.createNotification(
                    NotificationType.FEEDBACK_STATUS_CHANGED,
                    "Geri Bildirim Durumu Güncellendi",
                    "\"" + feedback.getTitle() + "\" geri bildiriminizin durumu \"" + statusLabel + "\" olarak güncellendi.",
                    "/feedback",
                    List.of(feedback.getCreatedBy().getId()));
        }

        List<FeedbackResponse> responses = feedbackResponseRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId);
        return toDetailResponse(saved, responses);
    }

    @Transactional
    public FeedbackResponseDto addResponse(UUID feedbackId, CreateFeedbackResponseRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);
        Feedback feedback = feedbackRepository.findByIdWithCreatedBy(feedbackId)
                .orElseThrow(() -> new RuntimeException("Geri bildirim bulunamadı"));

        boolean isOwner = feedback.getCreatedBy().getId().equals(user.getId());
        boolean isManager = List.of(Role.ADMIN, Role.MANAGER, Role.DIRECTOR).contains(user.getRole());
        if (!isOwner && !isManager) {
            throw new RuntimeException("Bu geri bildirime yanıt yazma yetkiniz yok");
        }

        FeedbackResponse response = new FeedbackResponse();
        response.setFeedback(feedback);
        response.setMessage(request.getMessage());
        response.setCreatedBy(user);

        FeedbackResponse saved = feedbackResponseRepository.save(response);

        if (isManager && !isOwner) {
            notificationService.createNotification(
                    NotificationType.FEEDBACK_RESPONSE,
                    "Geri Bildiriminize Yanıt",
                    "\"" + feedback.getTitle() + "\" geri bildiriminize yanıt yazıldı.",
                    "/feedback",
                    List.of(feedback.getCreatedBy().getId()));
        } else if (isOwner && !isManager) {
            notificationService.createNotificationForRoles(
                    NotificationType.FEEDBACK_RESPONSE,
                    "Geri Bildirime Kullanıcı Yanıtı",
                    buildFullName(user) + " \"" + feedback.getTitle() + "\" geri bildirimine yanıt yazdı.",
                    "/feedback",
                    List.of(Role.ADMIN, Role.MANAGER, Role.DIRECTOR));
        }

        return toResponseDto(saved);
    }

    @Transactional
    public void deleteFeedback(UUID feedbackId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Geri bildirim bulunamadı"));

        if (!feedback.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Bu geri bildirimi silme yetkiniz yok");
        }
        if (feedback.getStatus() != FeedbackStatus.NEW) {
            throw new RuntimeException("Sadece yeni durumdaki geri bildirimler silinebilir");
        }

        feedbackResponseRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId)
                .forEach(feedbackResponseRepository::delete);
        feedbackRepository.delete(feedback);
    }

    public FeedbackStatsResponse getStats() {
        return FeedbackStatsResponse.builder()
                .total(feedbackRepository.count())
                .newCount(feedbackRepository.countByStatus(FeedbackStatus.NEW))
                .reviewedCount(feedbackRepository.countByStatus(FeedbackStatus.REVIEWED))
                .inProgressCount(feedbackRepository.countByStatus(FeedbackStatus.IN_PROGRESS))
                .implementedCount(feedbackRepository.countByStatus(FeedbackStatus.IMPLEMENTED))
                .closedCount(feedbackRepository.countByStatus(FeedbackStatus.CLOSED))
                .wontFixCount(feedbackRepository.countByStatus(FeedbackStatus.WONT_FIX))
                .bugReportCount(feedbackRepository.countByType(FeedbackType.BUG_REPORT))
                .featureRequestCount(feedbackRepository.countByType(FeedbackType.FEATURE_REQUEST))
                .suggestionCount(feedbackRepository.countByType(FeedbackType.SUGGESTION))
                .generalCount(feedbackRepository.countByType(FeedbackType.GENERAL))
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
    }

    private String buildFullName(User user) {
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        }
        return user.getEmail();
    }

    private FeedbackSummaryResponse toSummaryResponse(Feedback f) {
        return FeedbackSummaryResponse.builder()
                .id(f.getId())
                .type(f.getType())
                .title(f.getTitle())
                .status(f.getStatus())
                .severity(f.getSeverity())
                .rating(f.getRating())
                .createdByName(buildFullName(f.getCreatedBy()))
                .createdByEmail(f.getCreatedBy().getEmail())
                .createdAt(f.getCreatedAt())
                .responseCount((int) feedbackResponseRepository.countByFeedbackId(f.getId()))
                .build();
    }

    private FeedbackDetailResponse toDetailResponse(Feedback f, List<FeedbackResponse> responses) {
        return FeedbackDetailResponse.builder()
                .id(f.getId())
                .type(f.getType())
                .title(f.getTitle())
                .description(f.getDescription())
                .pageUrl(f.getPageUrl())
                .severity(f.getSeverity())
                .status(f.getStatus())
                .rating(f.getRating())
                .adminNote(f.getAdminNote())
                .createdById(f.getCreatedBy().getId())
                .createdByName(buildFullName(f.getCreatedBy()))
                .createdByEmail(f.getCreatedBy().getEmail())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .responses(responses.stream().map(this::toResponseDto).collect(Collectors.toList()))
                .build();
    }

    private FeedbackResponseDto toResponseDto(FeedbackResponse fr) {
        return FeedbackResponseDto.builder()
                .id(fr.getId())
                .message(fr.getMessage())
                .createdByName(buildFullName(fr.getCreatedBy()))
                .createdByRole(fr.getCreatedBy().getRole() != null ? fr.getCreatedBy().getRole().name() : null)
                .createdAt(fr.getCreatedAt())
                .build();
    }

    private String getTypeLabel(FeedbackType type) {
        return switch (type) {
            case BUG_REPORT -> "Hata Bildirimi";
            case FEATURE_REQUEST -> "Özellik İsteği";
            case SUGGESTION -> "Öneri";
            case GENERAL -> "Genel Geri Bildirim";
        };
    }

    private String getStatusLabel(FeedbackStatus status) {
        return switch (status) {
            case NEW -> "Yeni";
            case REVIEWED -> "İncelendi";
            case IN_PROGRESS -> "İşlemde";
            case IMPLEMENTED -> "Uygulandı";
            case WONT_FIX -> "Uygulanmayacak";
            case CLOSED -> "Kapatıldı";
        };
    }
}
