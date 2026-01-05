package com.stokmate.controller;

import com.stokmate.domain.ActionType;
import com.stokmate.dto.store.StoreCreateRequest;
import com.stokmate.dto.store.StoreResponse;
import com.stokmate.dto.store.StoreUpdateRequest;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.PendingActionService;
import com.stokmate.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final PendingActionService pendingActionService;

    // Create/Update: DIRECTOR, MANAGER, ADMIN
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    @PostMapping
    public StoreResponse createStore(@Valid @RequestBody StoreCreateRequest request) {
        return storeService.createStore(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    @PutMapping("/{id}")
    public StoreResponse updateStore(@PathVariable("id") String id,
            @Valid @RequestBody StoreUpdateRequest request) {
        return storeService.updateStore(id, request);
    }

    // View: All authenticated users
    @GetMapping
    public List<StoreResponse> listStores(@RequestParam(value = "activeOnly", required = false) Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return storeService.listActiveStores();
        }
        return storeService.listAllStores();
    }

    @GetMapping("/{id}")
    public StoreResponse getStoreById(@PathVariable("id") String id) {
        return storeService.getStoreById(id);
    }

    // Delete: DIRECTOR creates pending action, MANAGER/ADMIN can delete directly
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteStore(@PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Check if user is DIRECTOR - they need approval
        if (principal.getUser().getRole().requiresDeleteApproval()) {
            // Create pending action instead of direct delete
            Map<String, Object> actionData = new HashMap<>();
            actionData.put("storeId", id);
            actionData.put("reason", "Store deletion requested by " + principal.getUser().getEmail());

            pendingActionService.createPendingAction(
                    ActionType.DELETE_STORE,
                    "Store",
                    UUID.fromString(id),
                    principal.getUser(),
                    actionData);

            Map<String, Object> response = new HashMap<>();
            response.put("pendingApproval", true);
            response.put("message", "Delete request submitted for approval");
            return response;
        }

        // ADMIN and MANAGER can delete directly
        storeService.deleteStore(id);
        Map<String, Object> response = new HashMap<>();
        response.put("deleted", true);
        return response;
    }
}
