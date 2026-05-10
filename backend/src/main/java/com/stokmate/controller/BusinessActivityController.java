package com.stokmate.controller;

import com.stokmate.domain.BusinessActivity;
import com.stokmate.service.BusinessActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/business-activities")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Business Activities")
public class BusinessActivityController {

    private final BusinessActivityService businessActivityService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @GetMapping
    @Operation(summary = "Get unified business activities", description = "Retrieves merged activities (Orders, Sales) with pagination and filtering")
    public Page<BusinessActivity> getActivities(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String category, // ORDER, SALE, or null
            @RequestParam(required = false) String search) {
        return businessActivityService.getAllActivities(pageable, category, search);
    }
}
