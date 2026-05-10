package com.stokmate.controller;

import com.stokmate.dto.store.StoreEmployeeRequest;
import com.stokmate.dto.store.StoreEmployeeResponse;
import com.stokmate.service.StoreEmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreEmployeeController {

    private final StoreEmployeeService storeEmployeeService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    @PostMapping("/{storeId}/employees")
    public StoreEmployeeResponse assignEmployee(@PathVariable("storeId") String storeId,
            @Valid @RequestBody StoreEmployeeRequest request) {
        return storeEmployeeService.assignEmployeeToStore(storeId, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    @DeleteMapping("/{storeId}/employees/{userId}")
    public void removeEmployee(@PathVariable("storeId") String storeId, @PathVariable("userId") String userId) {
        storeEmployeeService.removeEmployeeFromStore(storeId, userId);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'OPERATIONS_MANAGER', 'STORE_MANAGER')")
    @GetMapping("/{storeId}/employees")
    public List<StoreEmployeeResponse> getStoreEmployees(@PathVariable("storeId") String storeId) {
        return storeEmployeeService.getStoreEmployees(storeId);
    }
}
