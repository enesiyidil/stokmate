package com.stokmate.controller;

import com.stokmate.domain.ActionType;
import com.stokmate.dto.order.ExcelExtractionResponse;
import com.stokmate.dto.order.OrderCreateRequest;
import com.stokmate.dto.order.OrderResponse;
import com.stokmate.dto.order.InvoiceUrlResponse;
import com.stokmate.domain.OrderStatus;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.OrderService;
import com.stokmate.service.PendingActionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Orders")
public class OrderController {

        private final OrderService orderService;
        private final PendingActionService pendingActionService;

        // Create/Extract: STORE_MANAGER, DIRECTOR, MANAGER, ADMIN
        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER')")
        @PostMapping(value = "/extract-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @Operation(summary = "Extract order data from Excel file", description = "Extracts order and product data from Excel file with Turkish column headers")
        public ExcelExtractionResponse extractFromExcel(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Excel file (.xlsx or .xls)", required = true, content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE, schema = @Schema(type = "string", format = "binary"))) @RequestPart("file") MultipartFile file) {
                return orderService.extractFromExcel(file);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER')")
        @PostMapping
        @Operation(summary = "Create order with products", description = "Creates a new order with associated products")
        public OrderResponse createOrder(@Valid @RequestBody OrderCreateRequest request) {
                log.info("========== CREATE ORDER REQUEST ==========");
                log.info("Order No: {}", request.getOrderNo());
                log.info("Contract No: {}", request.getProsapContractNo());
                log.info("Contract Name: {}", request.getProsapContractNameSurname());
                log.info("Order Date: {}", request.getOrderDate());
                log.info("Customer ID: {}", request.getCustomerId());
                log.info("Number of products: {}", request.getProducts() != null ? request.getProducts().size() : 0);

                if (request.getProducts() != null) {
                        request.getProducts().forEach(p -> {
                                log.info("  Product - Code: {}, Name: {}, Quantity: {}",
                                                p.getProductCode(), p.getProductName(), p.getQuantity());
                        });
                }

                try {
                        OrderResponse response = orderService.createOrder(request);
                        log.info("Order created successfully with ID: {}", response.getId());
                        return response;
                } catch (Exception e) {
                        log.error("ERROR creating order: {}", e.getMessage(), e);
                        throw e;
                }
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE','OPERATIONS_MANAGER')")
        @GetMapping
        @Operation(summary = "List orders (optionally filter by status)", description = "Returns list of orders; optional query param `status` filters by order status. `includeHidden` includes SSH orders.")
        public java.util.List<OrderResponse> listOrders(
                        @org.springframework.web.bind.annotation.RequestParam(value = "status", required = false) String status,
                        @org.springframework.web.bind.annotation.RequestParam(value = "includeHidden", defaultValue = "false") boolean includeHidden) {
                OrderStatus s = null;
                if (status != null && !status.isBlank()) {
                        try {
                                s = OrderStatus.valueOf(status);
                        } catch (IllegalArgumentException e) {
                                throw new IllegalArgumentException("Invalid status: " + status);
                        }
                }
                return orderService.listOrdersByStatus(s, includeHidden);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
        @PostMapping("/{orderId}/complete")
        @Operation(summary = "Mark order as completed", description = "Changes order status to TAMAMLANDI")
        public OrderResponse completeOrder(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId) {
                return orderService.completeOrder(orderId);
        }

        // Cancel: DIRECTOR and above can approve, creates pending action for DIRECTOR
        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
        @PostMapping("/{orderId}/cancel")
        @Operation(summary = "Cancel order (requires approval for DIRECTOR)", description = "Changes order status to IPTAL_EDILDI or creates pending cancellation for approval")
        public Object cancelOrder(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true) @PathVariable("orderId") UUID orderId,
                        @AuthenticationPrincipal UserPrincipal principal) {
                // Check if user is DIRECTOR - they need approval
                if (principal.getUser().getRole().requiresDeleteApproval()) {
                        // Create pending action instead of direct cancel
                        Map<String, Object> actionData = new HashMap<>();
                        actionData.put("orderId", orderId.toString());
                        actionData.put("reason", "Order cancellation requested by " + principal.getUser().getEmail());

                        pendingActionService.createPendingAction(
                                        ActionType.CANCEL_ORDER,
                                        "Order",
                                        orderId,
                                        principal.getUser(),
                                        actionData);

                        Map<String, Object> response = new HashMap<>();
                        response.put("pendingApproval", true);
                        response.put("message", "Order cancellation request submitted for approval");
                        return response;
                }

                // ADMIN and MANAGER can cancel directly
                return orderService.cancelOrder(orderId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE','OPERATIONS_MANAGER')")
        @GetMapping("/{orderId}")
        @Operation(summary = "Get order by ID", description = "Retrieves order details including products")
        public OrderResponse getOrder(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId) {
                return orderService.getOrderById(orderId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER','STORE_MANAGER','STORE_EMPLOYEE')")
        @GetMapping("/pending-acceptance")
        @Operation(summary = "List orders pending product acceptance", description = "Returns orders that are completed (TAMAMLANDI) but products not yet accepted")
        public java.util.List<OrderResponse> listPendingAcceptanceOrders() {
                return orderService.listPendingAcceptanceOrders();
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
        @PostMapping("/{orderId}/accept-products")
        @Operation(summary = "Accept products for an order", description = "Sets productsAccepted to true for the given order. Order must be completed (TAMAMLANDI) first.")
        public OrderResponse acceptProducts(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId) {
                return orderService.acceptProducts(orderId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
        @PostMapping(value = "/{orderId}/invoice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @Operation(summary = "Upload invoice for an order", description = "Uploads invoice PDF to MinIO storage for the specified order")
        public OrderResponse uploadInvoice(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId,
                        @io.swagger.v3.oas.annotations.Parameter(description = "Invoice PDF file", required = true, content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE, schema = @Schema(type = "string", format = "binary"))) @RequestPart("file") MultipartFile file) {
                return orderService.uploadInvoice(orderId, file);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE','OPERATIONS_MANAGER')")
        @GetMapping("/{orderId}/invoice")
        @Operation(summary = "Get invoice download URL", description = "Returns a presigned URL to download/view the invoice PDF (valid for 7 days)")
        public InvoiceUrlResponse getInvoiceUrl(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId) {
                return orderService.getInvoiceUrl(orderId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER','STORE_MANAGER')")
        @GetMapping("/by-customer/{customerId}")
        @Operation(summary = "Get orders by customer ID", description = "Returns all orders for a specific customer, used for SSH parent order selection")
        public java.util.List<OrderResponse> getOrdersByCustomer(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Customer ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("customerId") UUID customerId) {
                return orderService.getOrdersByCustomerId(customerId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
        @PostMapping("/{orderId}/approve-shipment")
        @Operation(summary = "Approve shipment", description = "Approves shipment for an order pending approval")
        public OrderResponse approveShipment(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId) {
                return orderService.approveShipment(orderId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STORE_EMPLOYEE')")
        @org.springframework.web.bind.annotation.PatchMapping("/{orderId}/partial-delivery")
        @Operation(summary = "Update partial delivery status", description = "Updates partial delivery status for an order product. Only for CUSTOMER_SPECIFIC orders by sales consultant or admin.")
        public OrderResponse updatePartialDelivery(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true) @PathVariable("orderId") UUID orderId,
                        @Valid @RequestBody com.stokmate.dto.order.PartialDeliveryUpdateRequest request,
                        @org.springframework.security.core.annotation.AuthenticationPrincipal com.stokmate.domain.User currentUser) {
                return orderService.updatePartialDelivery(orderId, request, currentUser);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
        @org.springframework.web.bind.annotation.PatchMapping("/{orderId}/sales-consultant")
        @Operation(summary = "Update sales consultant", description = "Assigns or removes a sales consultant for an order. Only admin/manager can perform this action.")
        public OrderResponse updateSalesConsultant(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true) @PathVariable("orderId") UUID orderId,
                        @Valid @RequestBody com.stokmate.dto.order.UpdateSalesConsultantRequest request) {
                return orderService.updateSalesConsultant(orderId, request.getSalesConsultantId());
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STORE_MANAGER','STORE_EMPLOYEE')")
        @GetMapping("/{orderId}/events")
        @Operation(summary = "Get order events", description = "Returns event history for an order (delivery updates, notes changes)")
        public java.util.List<com.stokmate.dto.order.OrderEventResponse> getOrderEvents(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true) @PathVariable("orderId") UUID orderId) {
                return orderService.getOrderEvents(orderId);
        }

        @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
        @org.springframework.web.bind.annotation.PatchMapping("/{orderId}/brand")
        @Operation(summary = "Update brand for all order products", description = "Updates the brand for all products in the order. Only admin/manager can perform this action.")
        public OrderResponse updateBrand(
                        @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true) @PathVariable("orderId") UUID orderId,
                        @Valid @RequestBody com.stokmate.dto.order.UpdateBrandRequest request) {
                return orderService.updateBrand(orderId, request.getBrand());
        }
}
