package com.stokmate.controller;

import com.stokmate.dto.store.StoreCreateRequest;
import com.stokmate.dto.store.StoreResponse;
import com.stokmate.dto.store.StoreUpdateRequest;
import com.stokmate.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR')")
    @PostMapping
    public StoreResponse createStore(@Valid @RequestBody StoreCreateRequest request) {
        return storeService.createStore(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR')")
    @PutMapping("/{id}")
    public StoreResponse updateStore(@PathVariable("id") String id,
            @Valid @RequestBody StoreUpdateRequest request) {
        return storeService.updateStore(id, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'DEPO_SORUMLU', 'MAGAZA_SORUMLU')")
    @GetMapping
    public List<StoreResponse> listStores(@RequestParam(value = "activeOnly", required = false) Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return storeService.listActiveStores();
        }
        return storeService.listAllStores();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'DEPO_SORUMLU', 'MAGAZA_SORUMLU')")
    @GetMapping("/{id}")
    public StoreResponse getStoreById(@PathVariable("id") String id) {
        return storeService.getStoreById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR')")
    @DeleteMapping("/{id}")
    public void deleteStore(@PathVariable("id") String id) {
        storeService.deleteStore(id);
    }
}
