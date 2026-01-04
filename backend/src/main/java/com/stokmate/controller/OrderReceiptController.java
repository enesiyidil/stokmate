package com.stokmate.controller;

import com.stokmate.domain.OrderReceiptStatus;
import com.stokmate.dto.orderreceipt.OrderReceiptApprovalRequest;
import com.stokmate.dto.orderreceipt.OrderReceiptCreateRequest;
import com.stokmate.dto.orderreceipt.OrderReceiptResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.OrderReceiptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/order-receipts")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Order Receipts", description = "Product-by-product order receipt management with approval workflow")
public class OrderReceiptController {

    private final OrderReceiptService orderReceiptService;

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU','DEPO_CALISAN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create order receipt (accept products)", description = "Accept products for an order. DEPO_CALISAN creates pending receipts, others auto-approve.")
    public OrderReceiptResponse createReceipt(
            @Parameter(description = "Order product ID") @RequestParam("orderProductId") UUID orderProductId,
            @Parameter(description = "Received quantity") @RequestParam("receivedQuantity") String receivedQuantity,
            @Parameter(description = "Notes") @RequestParam(value = "notes", required = false) String notes,
            @Parameter(description = "Vehicle plate") @RequestParam(value = "vehiclePlate", required = false) String vehiclePlate,
            @Parameter(description = "Driver name") @RequestParam(value = "driverName", required = false) String driverName,
            @Parameter(description = "Driver phone") @RequestParam(value = "driverPhone", required = false) String driverPhone,
            @Parameter(description = "Photos") @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @AuthenticationPrincipal UserPrincipal principal) {

        OrderReceiptCreateRequest request = new OrderReceiptCreateRequest();
        request.setOrderProductId(orderProductId);
        request.setReceivedQuantity(new java.math.BigDecimal(receivedQuantity));
        request.setNotes(notes);
        request.setVehiclePlate(vehiclePlate);
        request.setDriverName(driverName);
        request.setDriverPhone(driverPhone);

        log.info("Creating receipt for order product {} by user {}", orderProductId, principal.getUser().getEmail());
        return orderReceiptService.createReceipt(request, photos, principal.getUser());
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU')")
    @GetMapping
    @Operation(summary = "List all receipts", description = "List receipts with optional filters")
    public List<OrderReceiptResponse> listReceipts(
            @Parameter(description = "Filter by order ID") @RequestParam(value = "orderId", required = false) UUID orderId,
            @Parameter(description = "Filter by status") @RequestParam(value = "status", required = false) OrderReceiptStatus status) {
        return orderReceiptService.listReceipts(orderId, status);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU')")
    @GetMapping("/{id}")
    @Operation(summary = "Get receipt by ID", description = "Retrieve single receipt with photos")
    public OrderReceiptResponse getReceipt(@PathVariable UUID id) {
        return orderReceiptService.getReceiptById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU')")
    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve receipt", description = "Approve a pending receipt")
    public OrderReceiptResponse approveReceipt(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) OrderReceiptApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (request == null) {
            request = new OrderReceiptApprovalRequest();
        }
        return orderReceiptService.approveReceipt(id, request, principal.getUser());
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU')")
    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject receipt", description = "Reject a pending receipt")
    public OrderReceiptResponse rejectReceipt(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) OrderReceiptApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (request == null) {
            request = new OrderReceiptApprovalRequest();
        }
        return orderReceiptService.rejectReceipt(id, request, principal.getUser());
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU','DEPO_CALISAN')")
    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get receipts for order", description = "Retrieve all receipts for a specific order")
    public List<OrderReceiptResponse> getReceiptsForOrder(@PathVariable UUID orderId) {
        return orderReceiptService.getReceiptsForOrder(orderId);
    }
}
