package com.stokmate.controller;

import com.stokmate.domain.ActionType;
import com.stokmate.dto.vehicle.VehicleRequest;
import com.stokmate.dto.vehicle.VehicleResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.PendingActionService;
import com.stokmate.service.VehicleService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Vehicles")
public class VehicleController {

    private final VehicleService vehicleService;
    private final PendingActionService pendingActionService;

    // Access: OPERATIONS_MANAGER, LOGISTICS_MANAGER, DIRECTOR, MANAGER, ADMIN
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER','LOGISTICS_MANAGER')")
    @GetMapping
    public List<VehicleResponse> getAll() {
        return vehicleService.getAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER','LOGISTICS_MANAGER')")
    @GetMapping("/{id}")
    public VehicleResponse getById(@PathVariable("id") UUID id) {
        return vehicleService.getById(id);
    }

    // Create: OPERATIONS_MANAGER, DIRECTOR, MANAGER, ADMIN
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @PostMapping
    public VehicleResponse create(@Valid @RequestBody VehicleRequest request) {
        return vehicleService.create(request);
    }

    // Update: OPERATIONS_MANAGER, DIRECTOR, MANAGER, ADMIN
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @PutMapping("/{id}")
    public VehicleResponse update(@PathVariable("id") UUID id, @Valid @RequestBody VehicleRequest request) {
        return vehicleService.update(id, request);
    }

    // Delete: DIRECTOR creates pending action, MANAGER/ADMIN can delete directly
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable("id") UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        // Check if user is DIRECTOR - they need approval
        if (principal.getUser().getRole().requiresDeleteApproval()) {
            // Create pending action instead of direct delete
            Map<String, Object> actionData = new HashMap<>();
            actionData.put("vehicleId", id.toString());
            actionData.put("reason", "Vehicle deletion requested by " + principal.getUser().getEmail());

            pendingActionService.createPendingAction(
                    ActionType.DELETE_VEHICLE,
                    "Vehicle",
                    id,
                    principal.getUser(),
                    actionData);

            Map<String, Object> response = new HashMap<>();
            response.put("pendingApproval", true);
            response.put("message", "Delete request submitted for approval");
            return response;
        }

        // ADMIN and MANAGER can delete directly
        vehicleService.delete(id);
        Map<String, Object> response = new HashMap<>();
        response.put("deleted", true);
        return response;
    }
}
