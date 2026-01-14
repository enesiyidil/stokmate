package com.stokmate.controller;

import com.stokmate.dto.shipment.*;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.ShipmentReportService;
import com.stokmate.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shipment")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final ShipmentReportService shipmentReportService;

    // View/Plan/Complete: LOGISTICS_MANAGER, DIRECTOR, MANAGER, ADMIN,
    // OPERATIONS_MANAGER; View only:
    // STORE roles
    @PostMapping("/request-approval")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER')")
    public ResponseEntity<ShipmentApprovalResponse> requestShipmentApproval(
            @RequestBody ShipmentApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ShipmentApprovalResponse response = shipmentService.requestShipmentApproval(request,
                userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<List<ShipmentResponse>> getPendingApprovals() {
        return ResponseEntity.ok(shipmentService.getPendingApprovals());
    }

    @GetMapping("/awaiting-planning")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<List<ShipmentResponse>> getAwaitingPlanningShipments() {
        return ResponseEntity.ok(shipmentService.getAwaitingPlanningShipments());
    }

    // First Approval: DIRECTOR, MANAGER, ADMIN, OPERATIONS_MANAGER - changes
    // PENDING to APPROVED
    @PostMapping("/{id}/approve-initial")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<ShipmentResponse> approveInitialShipment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ShipmentResponse response = shipmentService.approveInitialShipment(id, userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ready")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<List<ShipmentResponse>> getReadyForShipment() {
        // Get shipments with PLANNED status
        return ResponseEntity.ok(shipmentService.getReadyForShipment());
    }

    @PostMapping("/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER')")
    public ResponseEntity<ShipmentResponse> completeShipment(
            @ModelAttribute ShipmentCompletionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) throws Exception {
        ShipmentResponse response = shipmentService.completeShipment(request, userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<ShipmentResponse> finalizeShipment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ShipmentResponse response = shipmentService.finalizeShipment(id, userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/partial")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<Void> createPartialShipment(
            @RequestBody PartialShipmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        shipmentService.createPartialShipment(request, userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/details/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER', 'STORE_MANAGER')")
    public ResponseEntity<ShipmentDetailsResponse> getShipmentDetails(
            @PathVariable("orderId") UUID orderId) {
        return ResponseEntity.ok(shipmentService.getShipmentDetails(orderId));
    }

    @GetMapping("/details/shipment/{shipmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER', 'STORE_MANAGER', 'DIRECTOR')")
    public ResponseEntity<ShipmentDetailsResponse> getShipmentDetailsByShipmentId(
            @PathVariable("shipmentId") UUID shipmentId) {
        return ResponseEntity.ok(shipmentService.getShipmentDetailsByShipmentId(shipmentId));
    }

    @PostMapping("/{shipmentId}/plan")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER')")
    public ResponseEntity<Void> planShipment(
            @PathVariable("shipmentId") UUID shipmentId,
            @RequestBody PlannedShipmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        shipmentService.planShipment(shipmentId, request, userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{orderId}/driver")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER')")
    public ResponseEntity<Void> updateShipmentDriver(
            @PathVariable("orderId") UUID orderId,
            @RequestBody UpdateDriverRequest request) {
        shipmentService.updateShipmentDriver(orderId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{orderId}/report")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER', 'STORE_MANAGER', 'DIRECTOR')")
    public ResponseEntity<byte[]> generateShipmentReport(@PathVariable("orderId") UUID orderId) throws Exception {
        byte[] pdfBytes = shipmentReportService.generateShipmentReport(orderId);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=sevk-raporu-" + orderId + ".pdf")
                .body(pdfBytes);
    }

    /**
     * Create a shipment from a sale
     */
    @PostMapping("/sale/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER')")
    public ResponseEntity<Void> createSaleShipment(
            @RequestBody SaleShipmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        shipmentService.createSaleShipment(request, userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Get list of completed shipments awaiting final approval
     */
    @GetMapping("/completed-awaiting")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<List<ShipmentResponse>> getCompletedAwaitingApproval() {
        return ResponseEntity.ok(shipmentService.getCompletedAwaitingApproval());
    }

    /**
     * Get list of approved/finalized shipments
     */
    @GetMapping("/approved")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER')")
    public ResponseEntity<?> getApprovedShipments() {
        try {
            System.out.println("Controller: request received for approved shipments");
            List<ShipmentResponse> response = shipmentService.getApprovedShipments();
            System.out.println("Controller: successfully retrieved " + response.size() + " shipments");

            // Manual serialization check
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
                String json = mapper.writeValueAsString(response);
                System.out.println("Controller: Serialization successful. JSON length: " + json.length());
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                System.err.println("Controller: Serialization FAILED: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.internalServerError().body("Serialization failed: " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Controller Error in getApprovedShipments: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Download signed delivery document
     */
    @GetMapping("/{shipmentId}/signed-document")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER', 'STORE_MANAGER', 'DIRECTOR')")
    public ResponseEntity<org.springframework.core.io.Resource> getSignedDocument(
            @PathVariable("shipmentId") UUID shipmentId) {

        // This service method should return Resource and MediaType string
        // Since we don't have a Pair/Tuple class handy, we'll let service return byte[]
        // and handle here or
        // delegate resource creation to Controller.
        // Let's implement getting the InputStreamResource from service.

        return shipmentService.getSignedDocument(shipmentId);
    }

    /**
     * Get shipment progress for an order
     */
    @GetMapping("/progress/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'WAREHOUSE_STAFF', 'STORE_MANAGER')")
    public ResponseEntity<ShipmentProgressResponse> getOrderShipmentProgress(@PathVariable UUID orderId) {
        return ResponseEntity.ok(shipmentService.getOrderShipmentProgress(orderId));
    }

    /**
     * Get shipment progress for a sale
     */
    @GetMapping("/progress/sale/{saleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'STORE_MANAGER')")
    public ResponseEntity<ShipmentProgressResponse> getSaleShipmentProgress(@PathVariable UUID saleId) {
        return ResponseEntity.ok(shipmentService.getSaleShipmentProgress(saleId));
    }

    /**
     * Update delivery details (notes and additional photos) before final approval
     */
    @PatchMapping("/{shipmentId}/delivery-details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER')")
    public ResponseEntity<Void> updateDeliveryDetails(
            @PathVariable UUID shipmentId,
            @ModelAttribute DeliveryDetailsUpdateRequest request,
            @RequestParam(value = "additionalPhotos", required = false) List<org.springframework.web.multipart.MultipartFile> photos)
            throws Exception {
        shipmentService.updateDeliveryDetails(shipmentId, request, photos);
        return ResponseEntity.ok().build();
    }
}
