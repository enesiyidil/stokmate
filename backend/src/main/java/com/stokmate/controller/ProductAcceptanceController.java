package com.stokmate.controller;

import com.stokmate.domain.ProductAcceptance;
import com.stokmate.dto.acceptance.PendingProductResponse;
import com.stokmate.dto.acceptance.ProductAcceptanceRequest;
import com.stokmate.dto.acceptance.ProductAcceptanceResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.ProductAcceptanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/acceptances")
@RequiredArgsConstructor
public class ProductAcceptanceController {

    private final ProductAcceptanceService productAcceptanceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MUDUR', 'OPERATIONS_MANAGER')")
    public ResponseEntity<ProductAcceptanceResponse> acceptProduct(
            @Valid @ModelAttribute ProductAcceptanceRequest request,
            @RequestParam(value = "images") MultipartFile[] images,
            @AuthenticationPrincipal UserPrincipal principal) {

        ProductAcceptanceResponse response = productAcceptanceService.acceptProduct(
                request, images, principal.getUser());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MUDUR', 'OPERATIONS_MANAGER')")
    public ResponseEntity<List<PendingProductResponse>> getPendingProducts() {
        return ResponseEntity.ok(productAcceptanceService.getPendingProducts());
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<ProductAcceptanceResponse>> getAllPaged(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProductAcceptance.AcceptanceStatus status,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String acceptedBy,
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(productAcceptanceService.getAllPaged(
                search, status, brand, acceptedBy, pageable));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ProductAcceptanceResponse>> getOrderAcceptances(
            @PathVariable(value = "orderId") String orderId) {
        return ResponseEntity.ok(productAcceptanceService.getOrderAcceptances(orderId));
    }

    /**
     * Delete a product acceptance (Admin/Manager only)
     */
    @DeleteMapping("/{acceptanceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteAcceptance(
            @PathVariable String acceptanceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        productAcceptanceService.deleteAcceptance(acceptanceId, principal.getUser());
        return ResponseEntity.ok().build();
    }
}
