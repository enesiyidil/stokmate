package com.stokmate.controller;

import com.stokmate.dto.delivery.DeliveryCompletionRequest;
import com.stokmate.dto.delivery.DeliverySessionResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.DeliverySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliverySessionService deliverySessionService;

    // Logged in user can check session details
    @GetMapping("/session/{token}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<DeliverySessionResponse> validateSession(@PathVariable String token) {
        return ResponseEntity.ok(deliverySessionService.validateSession(token));
    }

    // Logged in user can complete delivery
    @PostMapping("/complete/{token}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<Void> completeDelivery(
            @PathVariable String token,
            @ModelAttribute DeliveryCompletionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) throws Exception {

        deliverySessionService.completeSession(token, request, userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }
}
