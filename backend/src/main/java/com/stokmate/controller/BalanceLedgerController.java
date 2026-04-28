package com.stokmate.controller;

import com.stokmate.dto.balance.*;
import com.stokmate.service.BalanceLedgerService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/balance-ledger")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Balance Ledger")
public class BalanceLedgerController {

    private final BalanceLedgerService balanceLedgerService;

    // View: ADMIN, MANAGER, DIRECTOR, STORE_MANAGER, STORE_EMPLOYEE
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @GetMapping
    public org.springframework.data.domain.Page<BalanceLedgerResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo,
            org.springframework.data.domain.Pageable pageable) {
        return balanceLedgerService.getAllPaged(search, status, dueDateFrom, dueDateTo, pageable);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @GetMapping("/{id}")
    public BalanceLedgerResponse getById(@PathVariable("id") UUID id) {
        return balanceLedgerService.getById(id);
    }

    // Create: ADMIN, MANAGER, DIRECTOR, STORE_MANAGER, STORE_EMPLOYEE
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @PostMapping
    public BalanceLedgerResponse create(@Valid @RequestBody BalanceLedgerRequest request) {
        return balanceLedgerService.create(request);
    }

    // Add payment: ADMIN, MANAGER, DIRECTOR, STORE_MANAGER, STORE_EMPLOYEE
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @PostMapping("/{id}/payment")
    public BalanceLedgerResponse addPayment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody BalancePaymentRequest request) {
        return balanceLedgerService.addPayment(id, request);
    }

    // Update: ADMIN, MANAGER, DIRECTOR only
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
    @PutMapping("/{id}")
    public BalanceLedgerResponse update(
            @PathVariable("id") UUID id,
            @Valid @RequestBody BalanceLedgerUpdateRequest request) {
        return balanceLedgerService.update(id, request);
    }

    // Delete: ADMIN, MANAGER, DIRECTOR only
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable("id") UUID id) {
        balanceLedgerService.delete(id);
        Map<String, Object> response = new HashMap<>();
        response.put("deleted", true);
        return response;
    }

    // Get contracts for a customer (for dropdown)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @GetMapping("/contracts/{customerId}")
    public List<ContractOption> getContractsByCustomer(@PathVariable("customerId") UUID customerId) {
        return balanceLedgerService.getContractsByCustomerId(customerId);
    }
}
