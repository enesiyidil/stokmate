package com.stokmate.controller;

import com.stokmate.domain.ActionType;
import com.stokmate.dto.customer.CustomerRequest;
import com.stokmate.dto.customer.CustomerResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.CustomerService;
import com.stokmate.service.PendingActionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;
    private final PendingActionService pendingActionService;

    // Create/Update: STORE_MANAGER, STORE_EMPLOYEE, DIRECTOR, MANAGER, ADMIN
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @PostMapping
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request) {
        return customerService.create(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable("id") UUID id, @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }

    // Delete: DIRECTOR creates pending action, MANAGER/ADMIN can delete directly
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable("id") UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        // Check if user is DIRECTOR - they need approval
        if (principal.getUser().getRole().requiresDeleteApproval()) {
            // Create pending action instead of direct delete
            Map<String, Object> actionData = new HashMap<>();
            actionData.put("customerId", id.toString());
            actionData.put("reason", "Customer deletion requested by " + principal.getUser().getEmail());

            pendingActionService.createPendingAction(
                    ActionType.DELETE_CUSTOMER,
                    "Customer",
                    id,
                    principal.getUser(),
                    actionData);

            Map<String, Object> response = new HashMap<>();
            response.put("pendingApproval", true);
            response.put("message", "Delete request submitted for approval");
            return response;
        }

        // ADMIN and MANAGER can delete directly
        customerService.delete(id);
        Map<String, Object> response = new HashMap<>();
        response.put("deleted", true);
        return response;
    }

    // View: All authenticated users
    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable("id") UUID id) {
        return customerService.get(id);
    }

    @GetMapping
    public Page<CustomerResponse> list(
            @org.springframework.web.bind.annotation.RequestParam(value = "search", required = false) String search,
            Pageable pageable) {
        return customerService.listPaged(search, pageable);
    }

    @GetMapping("/search")
    public java.util.List<CustomerResponse> search(@org.springframework.web.bind.annotation.RequestParam String query) {
        return customerService.searchByName(query);
    }
}
