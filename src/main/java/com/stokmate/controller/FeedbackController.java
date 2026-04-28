package com.stokmate.controller;

import com.stokmate.domain.FeedbackStatus;
import com.stokmate.domain.FeedbackType;
import com.stokmate.dto.feedback.*;
import com.stokmate.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
@Tag(name = "Feedbacks", description = "Geri bildirim ve öneri yönetimi")
@SecurityRequirement(name = "bearerAuth")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @Operation(summary = "Yeni geri bildirim oluştur")
    public ResponseEntity<FeedbackDetailResponse> create(
            @Valid @RequestBody CreateFeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(feedbackService.create(request, userDetails.getUsername()));
    }

    @GetMapping("/my")
    @Operation(summary = "Kendi geri bildirimlerimi listele")
    public ResponseEntity<List<FeedbackSummaryResponse>> getMyFeedbacks(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(feedbackService.getMyFeedbacks(userDetails.getUsername()));
    }

    @GetMapping
    @Operation(summary = "Tüm geri bildirimleri listele (Admin/Manager/Director)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<List<FeedbackSummaryResponse>> getAllFeedbacks(
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) FeedbackType type) {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks(status, type));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Geri bildirim detayı")
    public ResponseEntity<FeedbackDetailResponse> getFeedbackDetail(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(feedbackService.getFeedbackDetail(id, userDetails.getUsername()));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Geri bildirim durumunu güncelle (Admin/Manager/Director)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<FeedbackDetailResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateFeedbackStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(feedbackService.updateStatus(id, request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/responses")
    @Operation(summary = "Geri bildirime yanıt ekle")
    public ResponseEntity<FeedbackResponseDto> addResponse(
            @PathVariable UUID id,
            @Valid @RequestBody CreateFeedbackResponseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(feedbackService.addResponse(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Geri bildirimi sil")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        feedbackService.deleteFeedback(id, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    @Operation(summary = "Geri bildirim istatistikleri (Admin/Manager/Director)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<FeedbackStatsResponse> getStats() {
        return ResponseEntity.ok(feedbackService.getStats());
    }
}
