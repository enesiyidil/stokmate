package com.stokmate.controller;

import com.stokmate.dto.crossconversion.CrossConversionRequest;
import com.stokmate.dto.crossconversion.CrossConversionResponse;
import com.stokmate.service.CrossConversionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cross-conversions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Cross Conversions")
public class CrossConversionController {

    private final CrossConversionService crossConversionService;

    // View: All authenticated users (paginated)
    @GetMapping
    public org.springframework.data.domain.Page<CrossConversionResponse> getAll(
            @org.springframework.web.bind.annotation.RequestParam(value = "search", required = false) String search,
            @org.springframework.web.bind.annotation.RequestParam(value = "sourceBrand", required = false) String sourceBrand,
            @org.springframework.web.bind.annotation.RequestParam(value = "targetBrand", required = false) String targetBrand,
            org.springframework.data.domain.Pageable pageable) {
        return crossConversionService.getAllPaged(search, sourceBrand, targetBrand, pageable);
    }

    @GetMapping("/{id}")
    public CrossConversionResponse getById(@PathVariable("id") UUID id) {
        return crossConversionService.getById(id);
    }

    // Create: ADMIN, MANAGER, DIRECTOR, STORE_MANAGER, STORE_EMPLOYEE
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE')")
    @PostMapping
    public CrossConversionResponse create(@Valid @RequestBody CrossConversionRequest request) {
        return crossConversionService.create(request);
    }

    // Update: ADMIN, MANAGER, DIRECTOR
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
    @PutMapping("/{id}")
    public CrossConversionResponse update(@PathVariable("id") UUID id,
            @Valid @RequestBody CrossConversionRequest request) {
        return crossConversionService.update(id, request);
    }

    // Delete: ADMIN, MANAGER only
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable("id") UUID id) {
        crossConversionService.delete(id);
        Map<String, Object> response = new HashMap<>();
        response.put("deleted", true);
        return response;
    }
}
