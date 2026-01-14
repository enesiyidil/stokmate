package com.stokmate.controller;

import com.stokmate.dto.support.*;
import com.stokmate.service.SupportRequestService;
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
@RequestMapping("/api/support-requests")
@RequiredArgsConstructor
@Tag(name = "Support Requests", description = "Destek talepleri yönetimi")
@SecurityRequirement(name = "bearerAuth")
public class SupportRequestController {

    private final SupportRequestService supportRequestService;

    @PostMapping
    @Operation(summary = "Yeni talep oluştur")
    public ResponseEntity<SupportRequestResponse> create(
            @Valid @RequestBody CreateSupportRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.create(request, userDetails.getUsername()));
    }

    @GetMapping("/my")
    @Operation(summary = "Kendi taleplerimizi listele")
    public ResponseEntity<List<SupportRequestResponse>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.getMyRequests(userDetails.getUsername()));
    }

    @GetMapping
    @Operation(summary = "Tüm talepleri listele (Admin/Manager/Director)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<List<SupportRequestResponse>> getAllRequests() {
        return ResponseEntity.ok(supportRequestService.getAllRequests());
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Talep durumunu güncelle (Admin/Manager/Director)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<SupportRequestResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateSupportRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.updateStatus(id, request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Kendi talebini iptal et")
    public ResponseEntity<Void> cancel(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        supportRequestService.cancel(id, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Kendi talebini sil")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        supportRequestService.delete(id, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/count/open")
    @Operation(summary = "Açık talep sayısını getir")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<Long> countOpenRequests() {
        return ResponseEntity.ok(supportRequestService.countOpenRequests());
    }
}
