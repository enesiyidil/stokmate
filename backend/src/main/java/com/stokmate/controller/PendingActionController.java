package com.stokmate.controller;

import com.stokmate.domain.PendingAction;
import com.stokmate.dto.pendingaction.PendingActionResponse;
import com.stokmate.dto.pendingaction.ReviewActionRequest;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.PendingActionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pending-actions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class PendingActionController {

    private final PendingActionService pendingActionService;

    /**
     * Get all pending actions (ADMIN and MANAGER only)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<PendingActionResponse> getAllPendingActions() {
        return pendingActionService.getAllPendingActions().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all actions including history (ADMIN and MANAGER only)
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<PendingActionResponse> getAllActions() {
        return pendingActionService.getAllActions().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approve a pending action (ADMIN only)
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public void approveAction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) ReviewActionRequest request) {
        String notes = request != null ? request.getReviewNotes() : null;
        pendingActionService.approveAction(id, principal.getUser(), notes);
    }

    /**
     * Reject a pending action (ADMIN only)
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public void rejectAction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) ReviewActionRequest request) {
        String notes = request != null ? request.getReviewNotes() : null;
        pendingActionService.rejectAction(id, principal.getUser(), notes);
    }

    private PendingActionResponse toResponse(PendingAction action) {
        PendingActionResponse response = new PendingActionResponse();
        response.setId(action.getId());
        response.setActionType(action.getActionType());
        response.setEntityType(action.getEntityType());
        response.setEntityId(action.getEntityId());
        response.setRequestedByEmail(action.getRequestedBy().getEmail());
        response.setRequestedByName(
                action.getRequestedBy().getFirstName() + " " + action.getRequestedBy().getLastName());
        response.setRequestedAt(action.getRequestedAt());
        response.setStatus(action.getStatus());
        response.setActionData(action.getActionData());

        if (action.getReviewedBy() != null) {
            response.setReviewedByEmail(action.getReviewedBy().getEmail());
            response.setReviewedByName(
                    action.getReviewedBy().getFirstName() + " " + action.getReviewedBy().getLastName());
        }
        response.setReviewedAt(action.getReviewedAt());
        response.setReviewNotes(action.getReviewNotes());

        return response;
    }
}
