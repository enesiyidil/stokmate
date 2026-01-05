package com.stokmate.service;

import com.stokmate.domain.ActivityType;
import org.springframework.http.ResponseEntity;
import com.stokmate.domain.ApprovalStatus;
import com.stokmate.domain.Customer;
import com.stokmate.domain.DeliveryStatus;
import com.stokmate.domain.Order;
import com.stokmate.domain.OrderProduct;
import com.stokmate.domain.OrderStatus;
import com.stokmate.domain.OrderType;
import com.stokmate.domain.ProblemType;
import com.stokmate.domain.Sale;
import com.stokmate.domain.SaleProduct;
import com.stokmate.domain.SaleStatus;
import com.stokmate.domain.Shipment;
import com.stokmate.domain.ShipmentItem;
import com.stokmate.domain.ShipmentItemType;
import com.stokmate.domain.ShipmentStatus;
import com.stokmate.domain.User;
import com.stokmate.domain.Vehicle;
import com.stokmate.dto.shipment.DeliveryDetailsUpdateRequest;
import com.stokmate.dto.shipment.PartialShipmentRequest;
import com.stokmate.dto.shipment.PlannedShipmentRequest;
import com.stokmate.dto.shipment.ProductShipmentRequest;
import com.stokmate.dto.shipment.SaleProductShipmentRequest;
import com.stokmate.dto.shipment.SaleShipmentRequest;
import com.stokmate.dto.shipment.ShipmentDetailsResponse;
import com.stokmate.dto.shipment.ShipmentProgressResponse;
import com.stokmate.dto.shipment.ShipmentResponse;
import com.stokmate.dto.shipment.ShipmentApprovalRequest;
import com.stokmate.dto.shipment.ShipmentApprovalResponse;
import com.stokmate.dto.shipment.ShipmentCompletionRequest;
import com.stokmate.dto.shipment.UpdateDriverRequest;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.repository.OrderProductRepository;
import com.stokmate.repository.OrderRepository;
import com.stokmate.repository.SaleProductRepository;
import com.stokmate.repository.SaleRepository;
import com.stokmate.repository.ShipmentRepository;
import com.stokmate.repository.UserRepository;
import com.stokmate.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShipmentService {

        private final ShipmentRepository shipmentRepository;
        private final OrderRepository orderRepository;
        private final OrderProductRepository orderProductRepository;
        private final SaleRepository saleRepository;
        private final SaleProductRepository saleProductRepository;
        private final OrderActivityService orderActivityService;
        private final UserRepository userRepository;
        private final VehicleRepository vehicleRepository;
        private final StorageService storageService;

        @org.springframework.context.annotation.Lazy
        @org.springframework.beans.factory.annotation.Autowired
        private OrderService orderService;

        @Transactional
        public ShipmentApprovalResponse requestShipmentApproval(ShipmentApprovalRequest request, UUID requesterId) {
                Order order = orderRepository.findById(request.getOrderId())
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                order.setStatus(OrderStatus.PENDING_SHIPMENT_APPROVAL);
                orderRepository.save(order);

                // We mock a response or use a simple one since we removed ShipmentApproval
                // entity dependency for flow
                return ShipmentApprovalResponse.builder()
                                .orderId(order.getId())
                                .orderNo(order.getOrderNo())
                                .status(ApprovalStatus.PENDING)
                                .build();
        }

        @Transactional
        public ShipmentApprovalResponse approveShipment(UUID orderId, UUID approverId) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                if (order.getStatus() != OrderStatus.PENDING_SHIPMENT_APPROVAL) {
                        // Allow idempotent retry if already approved?
                        if (order.getStatus() == OrderStatus.SHIPMENT_APPROVED) {
                                // return dummy or existing
                        }
                        throw new BadRequestException("Order is not pending shipment approval");
                }

                User approver = userRepository.findById(approverId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                // Update Order
                order.setStatus(OrderStatus.SHIPMENT_APPROVED);
                orderRepository.save(order);

                // Create Shipment Entity automatically
                Shipment shipment = new Shipment();
                shipment.setOrder(order);
                // plannedShipmentDate should be set during planning phase
                shipment.setStatus(ShipmentStatus.PENDING_COMPLETION);
                shipment.setApprovedBy(approver);
                shipment.setApprovalDate(LocalDateTime.now());
                shipmentRepository.save(shipment);

                return ShipmentApprovalResponse.builder()
                                .orderId(order.getId())
                                .orderNo(order.getOrderNo())
                                .status(ApprovalStatus.APPROVED)
                                .approvedById(approver.getId())
                                .approvedByName(approver.getFirstName() + " " + approver.getLastName())
                                .approvalDate(LocalDateTime.now())
                                .build();
        }

        /**
         * Get detailed shipment information for an order/sale
         */
        @Transactional
        public ShipmentDetailsResponse getShipmentDetails(UUID orderId) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                // Get or create shipment
                List<Shipment> shipments = shipmentRepository.findByOrderId(orderId);
                Shipment shipment = shipments.isEmpty() ? null : shipments.get(0);

                // Build customer info
                ShipmentDetailsResponse.CustomerInfo customerInfo = null;
                if (order.getCustomer() != null) {
                        Customer c = order.getCustomer();
                        customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                        .name(c.getFirstName() + " " + c.getLastName())
                                        .phone(c.getPhone())
                                        .address(c.getFullAddress())
                                        .build();
                } else if (order.getProsapContractNameSurname() != null) {
                        customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                        .name(order.getProsapContractNameSurname())
                                        .phone("")
                                        .address("")
                                        .build();
                }

                // Build sales consultant info
                ShipmentDetailsResponse.UserInfo consultantInfo = null;
                if (order.getSalesConsultant() != null) {
                        consultantInfo = ShipmentDetailsResponse.UserInfo.builder()
                                        .id(order.getSalesConsultant().getId().toString())
                                        .name(order.getSalesConsultant().getFirstName() + " "
                                                        + order.getSalesConsultant().getLastName())
                                        .build();
                }

                // Build driver info
                ShipmentDetailsResponse.UserInfo driverInfo = null;
                if (shipment != null && shipment.getShippedBy() != null) {
                        driverInfo = ShipmentDetailsResponse.UserInfo.builder()
                                        .id(shipment.getShippedBy().getId().toString())
                                        .name(shipment.getShippedBy().getFirstName() + " "
                                                        + shipment.getShippedBy().getLastName())
                                        .build();
                }

                // Build vehicle info
                ShipmentDetailsResponse.VehicleInfo vehicleInfo = null;
                if (shipment != null && shipment.getVehicle() != null) {
                        vehicleInfo = ShipmentDetailsResponse.VehicleInfo.builder()
                                        .id(shipment.getVehicle().getId().toString())
                                        .licensePlate(shipment.getVehicle().getLicensePlate())
                                        .vehicleType(shipment.getVehicle().getVehicleType())
                                        .build();
                }

                // Build product details with shipment status
                List<ShipmentDetailsResponse.ProductShipmentDetail> productDetails;

                if (shipment != null && !shipment.getItems().isEmpty()) {
                        // If shipment exists with items, show shipment items
                        productDetails = shipment.getItems().stream()
                                        .map(si -> {
                                                OrderProduct op = si.getOrderProduct();
                                                int totalQty = op.getQuantity().intValue();
                                                int shippedQty = op.getShippedQuantity() != null
                                                                ? op.getShippedQuantity().intValue()
                                                                : 0;
                                                int pendingQty = si.getShippedQuantity(); // Quantity in this shipment

                                                // shippedQuantity in OrderProduct ALREADY includes this pending
                                                // shipment
                                                // So remaining is just total - shipped
                                                int remainingQty = totalQty - shippedQty;

                                                return ShipmentDetailsResponse.ProductShipmentDetail.builder()
                                                                .productCode(op.getProductCode())
                                                                .productName(op.getProductName())
                                                                .totalQuantity(totalQty)
                                                                .shippedQuantity(shippedQty)
                                                                .pendingQuantity(pendingQty) // Items in this shipment
                                                                .remainingQuantity(Math.max(0, remainingQty))
                                                                .build();
                                        })
                                        .collect(Collectors.toList());
                } else {
                        // No shipment items yet, show all order products
                        productDetails = order.getProducts().stream()
                                        .map(op -> {
                                                int totalQty = op.getQuantity().intValue();
                                                int shippedQty = op.getShippedQuantity() != null
                                                                ? op.getShippedQuantity().intValue()
                                                                : 0;
                                                int acceptedQty = op.getAcceptedQuantity() != null
                                                                ? op.getAcceptedQuantity().intValue()
                                                                : 0;
                                                int pendingQty = Math.max(0, acceptedQty - shippedQty);
                                                int remainingQty = totalQty - shippedQty - pendingQty;

                                                return ShipmentDetailsResponse.ProductShipmentDetail.builder()
                                                                .productCode(op.getProductCode())
                                                                .productName(op.getProductName())
                                                                .totalQuantity(totalQty)
                                                                .shippedQuantity(shippedQty)
                                                                .pendingQuantity(pendingQty) // Accepted but not yet
                                                                                             // shipped
                                                                .remainingQuantity(Math.max(0, remainingQty))
                                                                .build();
                                        })
                                        .collect(Collectors.toList());
                }

                return ShipmentDetailsResponse.builder()
                                .orderId(order.getId().toString())
                                .shipmentId(shipment != null ? shipment.getId().toString() : null)
                                .orderNo(order.getOrderNo())
                                .orderType("ORDER")
                                .orderDate(java.time.LocalDateTime.ofInstant(order.getCreatedAt(),
                                                java.time.ZoneId.systemDefault()))
                                .contractNo(order.getProsapContractNo())
                                .customer(customerInfo)
                                .salesConsultant(consultantInfo)
                                .driver(driverInfo)
                                .vehicle(vehicleInfo)
                                .products(productDetails)
                                .shipmentStatus(shipment != null && shipment.getStatus() != null
                                                ? shipment.getStatus().toString()
                                                : order.getStatus().toString())
                                .plannedShipmentDate(
                                                shipment != null ? shipment.getPlannedShipmentDate() : null)
                                .approvedBy(shipment != null && shipment.getApprovedBy() != null
                                                ? shipment.getApprovedBy().getFirstName() + " "
                                                                + shipment.getApprovedBy().getLastName()
                                                : null)
                                .deliveryNotes(shipment != null ? shipment.getDeliveryNotes() : null)
                                .signedDocumentUrl(shipment != null ? shipment.getSignedDocumentPath() : null)
                                .deliveryPhotoUrls(shipment != null && shipment.getDeliveryPhotoPaths() != null
                                                ? new ArrayList<>(shipment.getDeliveryPhotoPaths())
                                                : null)
                                .build();
        }

        /**
         * Get detailed shipment information by Shipment ID
         */
        @Transactional
        public ShipmentDetailsResponse getShipmentDetailsByShipmentId(UUID shipmentId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));
                Order order = shipment.getOrder();

                // Build customer info
                ShipmentDetailsResponse.CustomerInfo customerInfo = null;
                if (order.getCustomer() != null) {
                        Customer c = order.getCustomer();
                        customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                        .name(c.getFirstName() + " " + c.getLastName())
                                        .phone(c.getPhone())
                                        .address(c.getFullAddress())
                                        .build();
                } else if (order.getProsapContractNameSurname() != null) {
                        customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                        .name(order.getProsapContractNameSurname())
                                        .phone("")
                                        .address("")
                                        .build();
                }

                // Build sales consultant info
                ShipmentDetailsResponse.UserInfo consultantInfo = null;
                if (order.getSalesConsultant() != null) {
                        consultantInfo = ShipmentDetailsResponse.UserInfo.builder()
                                        .id(order.getSalesConsultant().getId().toString())
                                        .name(order.getSalesConsultant().getFirstName() + " "
                                                        + order.getSalesConsultant().getLastName())
                                        .build();
                }

                // Build driver info
                ShipmentDetailsResponse.UserInfo driverInfo = null;
                if (shipment.getShippedBy() != null) {
                        driverInfo = ShipmentDetailsResponse.UserInfo.builder()
                                        .id(shipment.getShippedBy().getId().toString())
                                        .name(shipment.getShippedBy().getFirstName() + " "
                                                        + shipment.getShippedBy().getLastName())
                                        .build();
                }

                // Build vehicle info
                ShipmentDetailsResponse.VehicleInfo vehicleInfo = null;
                if (shipment.getVehicle() != null) {
                        vehicleInfo = ShipmentDetailsResponse.VehicleInfo.builder()
                                        .id(shipment.getVehicle().getId().toString())
                                        .licensePlate(shipment.getVehicle().getLicensePlate())
                                        .vehicleType(shipment.getVehicle().getVehicleType())
                                        .build();
                }

                // Build product details
                List<ShipmentDetailsResponse.ProductShipmentDetail> productDetails = shipment.getItems().stream()
                                .map(si -> {
                                        OrderProduct op = si.getOrderProduct();
                                        int totalQty = op.getQuantity().intValue();
                                        int shippedQty = op.getShippedQuantity() != null
                                                        ? op.getShippedQuantity().intValue()
                                                        : 0;
                                        int pendingQty = si.getShippedQuantity(); // Quantity in this shipment
                                        // remaining is total - shipped (since shipped includes this shipment's qty if
                                        // finalized, or we adjust logic)
                                        // If status is COMPLETED, shippedQty includes this.
                                        // If status is PENDING, shippedQty might NOT include this depending on logic.
                                        // But our finalizeShipment updates shippedQty.

                                        int remainingQty = Math.max(0, totalQty - shippedQty);

                                        return ShipmentDetailsResponse.ProductShipmentDetail.builder()
                                                        .productCode(op.getProductCode())
                                                        .productName(op.getProductName())
                                                        .totalQuantity(totalQty)
                                                        .shippedQuantity(shippedQty)
                                                        .pendingQuantity(pendingQty)
                                                        .remainingQuantity(remainingQty)
                                                        .build();
                                })
                                .collect(Collectors.toList());

                return ShipmentDetailsResponse.builder()
                                .orderId(order.getId().toString())
                                .shipmentId(shipment.getId().toString())
                                .orderNo(order.getOrderNo())
                                .orderType("ORDER")
                                .orderDate(java.time.LocalDateTime.ofInstant(order.getCreatedAt(),
                                                java.time.ZoneId.systemDefault()))
                                .contractNo(order.getProsapContractNo())
                                .customer(customerInfo)
                                .salesConsultant(consultantInfo)
                                .driver(driverInfo)
                                .vehicle(vehicleInfo)
                                .products(productDetails)
                                .shipmentStatus(shipment.getStatus().toString())
                                .plannedShipmentDate(shipment.getPlannedShipmentDate())
                                .approvedBy(shipment.getApprovedBy() != null
                                                ? shipment.getApprovedBy().getFirstName() + " "
                                                                + shipment.getApprovedBy().getLastName()
                                                : null)
                                .deliveryStatus(shipment.getDeliveryStatus() != null
                                                ? shipment.getDeliveryStatus().toString()
                                                : null)
                                .problemType(shipment.getProblemType() != null ? shipment.getProblemType().toString()
                                                : null)
                                .deliveryNotes(shipment.getDeliveryNotes())
                                .signedDocumentUrl(shipment.getSignedDocumentPath())
                                .deliveryPhotoUrls(shipment.getDeliveryPhotoPaths() != null
                                                ? new ArrayList<>(shipment.getDeliveryPhotoPaths())
                                                : null)
                                .build();
        }

        /**
         * Plan shipment with driver and vehicle (driver is current user by default)
         */
        @Transactional
        public void planShipment(UUID orderId, PlannedShipmentRequest request, UUID currentUserId) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                                .orElseThrow(() -> new NotFoundException("Vehicle not found"));

                // Use provided driverId if available, otherwise default to current user
                UUID driverIdToUse = request.getDriverId() != null ? request.getDriverId() : currentUserId;
                User driver = userRepository.findById(driverIdToUse)
                                .orElseThrow(() -> new NotFoundException("Driver not found"));

                // Get or create shipment
                List<Shipment> shipments = shipmentRepository.findByOrderId(orderId);
                Shipment shipment = shipments.isEmpty() ? new Shipment() : shipments.get(0);

                if (shipment.getId() == null) {
                        shipment.setOrder(order);
                        shipment.setStatus(ShipmentStatus.PENDING_COMPLETION);
                }

                shipment.setPlannedShipmentDate(request.getPlannedDate());
                shipment.setVehicle(vehicle);
                shipment.setShippedBy(driver);
                shipmentRepository.save(shipment);

                // Log activity
                orderActivityService.logActivity(order, ActivityType.SHIPMENT_CREATED,
                                "Sevk planlandı - Tarih: " + request.getPlannedDate() + ", Plaka: "
                                                + vehicle.getLicensePlate());
        }

        /**
         * Update shipment driver (ADMIN/MANAGER only)
         */
        @Transactional
        public void updateShipmentDriver(UUID orderId, UpdateDriverRequest request) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                List<Shipment> shipments = shipmentRepository.findByOrderId(orderId);
                if (shipments.isEmpty()) {
                        throw new NotFoundException("No shipment found for this order");
                }

                Shipment shipment = shipments.get(0);
                User newDriver = userRepository.findById(request.getDriverId())
                                .orElseThrow(() -> new NotFoundException("User not found"));

                User oldDriver = shipment.getShippedBy();
                shipment.setShippedBy(newDriver);
                shipmentRepository.save(shipment);

                // Log activity
                String oldDriverName = oldDriver != null
                                ? oldDriver.getFirstName() + " " + oldDriver.getLastName()
                                : "Atanmamış";
                String newDriverName = newDriver.getFirstName() + " " + newDriver.getLastName();
                orderActivityService.logActivity(order, ActivityType.SHIPMENT_CREATED,
                                "Şoför değiştirildi: " + oldDriverName + " -> " + newDriverName);
        }

        public List<ShipmentResponse> getReadyForShipment() {
                return shipmentRepository.findByStatus(ShipmentStatus.PENDING_COMPLETION).stream()
                                .map(this::toShipmentResponse)
                                .collect(Collectors.toList());
        }

        public List<ShipmentApprovalResponse> getPendingApprovals() {
                return orderRepository.findByStatus(OrderStatus.PENDING_SHIPMENT_APPROVAL).stream()
                                .map(order -> ShipmentApprovalResponse.builder()
                                                .orderId(order.getId())
                                                .orderNo(order.getOrderNo())
                                                .status(ApprovalStatus.PENDING)
                                                .requestDate(java.time.LocalDateTime.ofInstant(order.getUpdatedAt(),
                                                                java.time.ZoneId.systemDefault()))
                                                .build())
                                .collect(Collectors.toList());
        }

        @Transactional
        public ShipmentResponse completeShipment(ShipmentCompletionRequest request, UUID shippedById) throws Exception {
                Shipment shipment = shipmentRepository.findById(request.getShipmentId())
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                User shippedBy = userRepository.findById(shippedById)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                // Update shipment details
                shipment.setActualShipmentDate(LocalDateTime.now());
                shipment.setShippedBy(shippedBy);
                shipment.setDeliveryStatus(request.getDeliveryStatus());
                shipment.setProblemType(request.getProblemType());
                shipment.setDeliveryNotes(request.getDeliveryNotes());
                shipment.setStatus(ShipmentStatus.COMPLETED);

                // Upload files
                if (request.getSignedDocument() != null && !request.getSignedDocument().isEmpty()) {
                        String signedDocPath = storageService.store(request.getSignedDocument(), "shipment-documents");
                        shipment.setSignedDocumentPath(signedDocPath);
                }

                if (request.getDeliveryPhotos() != null && !request.getDeliveryPhotos().isEmpty()) {
                        List<String> photoPaths = new java.util.ArrayList<>();
                        for (MultipartFile photo : request.getDeliveryPhotos()) {
                                if (!photo.isEmpty()) {
                                        String photoPath = storageService.store(photo, "shipment-photos");
                                        photoPaths.add(photoPath);
                                }
                        }
                        shipment.setDeliveryPhotoPaths(photoPaths);
                }

                shipmentRepository.save(shipment);
                return toShipmentResponse(shipment);
        }

        @Transactional
        public ShipmentResponse finalizeShipment(UUID shipmentId, UUID finalizerId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                if (shipment.getStatus() != ShipmentStatus.COMPLETED) {
                        throw new BadRequestException("Shipment must be completed before finalizing");
                }

                // Update shipped quantities for order products
                for (ShipmentItem item : shipment.getItems()) {
                        if (item.getOrderProduct() != null) {
                                OrderProduct op = item.getOrderProduct();
                                BigDecimal currentShipped = op.getShippedQuantity() != null ? op.getShippedQuantity()
                                                : BigDecimal.ZERO;
                                op.setShippedQuantity(
                                                currentShipped.add(BigDecimal.valueOf(item.getShippedQuantity())));
                                orderProductRepository.save(op);
                        }
                }

                User finalizer = userRepository.findById(finalizerId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                Order order = shipment.getOrder();

                // If order is linked to a sale, check if all products shipped for sale
                // completion
                if (shipment.getSale() != null) {
                        boolean allProductsShipped = order.getProducts().stream()
                                        .allMatch(op -> {
                                                BigDecimal shipped = op.getShippedQuantity() != null
                                                                ? op.getShippedQuantity()
                                                                : BigDecimal.ZERO;
                                                BigDecimal quantity = op.getQuantity() != null
                                                                ? op.getQuantity()
                                                                : BigDecimal.ZERO;
                                                return shipped.compareTo(quantity) >= 0;
                                        });

                        if (allProductsShipped) {
                                Sale sale = shipment.getSale();
                                sale.setStatus(com.stokmate.domain.SaleStatus.TAMAMLANDI);
                                saleRepository.save(sale);
                        }
                }

                // Set approver and approval date
                shipment.setApprovedBy(finalizer);
                shipment.setApprovalDate(LocalDateTime.now());
                shipment.setStatus(ShipmentStatus.APPROVED);
                shipmentRepository.save(shipment);

                // Check and auto-complete order if all products shipped
                orderService.checkAndCompleteOrder(order.getId());

                // Log activity
                String statusText = shipment.getDeliveryStatus() != null
                                ? (shipment.getDeliveryStatus().toString().equals("PROBLEM_FREE") ? "Sorunsuz"
                                                : "Sorunlu")
                                : "Bilinmeyen";
                orderActivityService.logActivity(order, ActivityType.SHIPMENT_APPROVED,
                                "Sevk onaylandı ve tamamlandı (" + statusText + " teslimat) - Onaylayan: "
                                                + finalizer.getFirstName() + " " + finalizer.getLastName());

                return toShipmentResponse(shipment);
        }

        /**
         * Create a partial shipment for specific products (only accepted quantities)
         * If there's already a pending shipment (PENDING_COMPLETION), add items to it
         * Otherwise create a new shipment
         */
        @Transactional
        public void createPartialShipment(PartialShipmentRequest request, UUID userId) {
                Order order = orderRepository.findById(request.getOrderId())
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                if (order.getOrderType() != OrderType.CUSTOMER_SPECIFIC) {
                        throw new BadRequestException("Partial shipment is only allowed for customer-specific orders");
                }

                // Find pending shipments (not yet completed or approved)
                List<Shipment> pendingShipments = shipmentRepository.findByOrder(order).stream()
                                .filter(s -> s.getStatus() == ShipmentStatus.PENDING_COMPLETION)
                                .collect(Collectors.toList());

                // Get all active shipments (including COMPLETED waiting for approval)
                List<Shipment> activeShipments = shipmentRepository.findByOrder(order).stream()
                                .filter(s -> s.getStatus() != ShipmentStatus.APPROVED)
                                .collect(Collectors.toList());

                // Validation: Only accepted quantities can be shipped
                for (ProductShipmentRequest psr : request.getProductShipments()) {
                        OrderProduct op = orderProductRepository.findById(psr.getOrderProductId())
                                        .orElseThrow(() -> new NotFoundException("Order product not found"));

                        // Calculate quantity already in pending/active shipments
                        BigDecimal pendingInShipments = activeShipments.stream()
                                        .flatMap(s -> s.getItems().stream())
                                        .filter(item -> item.getOrderProduct().getId().equals(op.getId()))
                                        .map(item -> BigDecimal.valueOf(item.getShippedQuantity()))
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        BigDecimal shipped = op.getShippedQuantity() != null ? op.getShippedQuantity()
                                        : BigDecimal.ZERO;
                        BigDecimal totalUsed = shipped.add(pendingInShipments);
                        BigDecimal accepted = op.getAcceptedQuantity() != null ? op.getAcceptedQuantity()
                                        : BigDecimal.ZERO;
                        BigDecimal available = accepted.subtract(totalUsed);

                        if (psr.getQuantityToShip().compareTo(available) > 0) {
                                throw new BadRequestException(
                                                "Cannot ship more than accepted quantity for product: "
                                                                + op.getProductName() + ". Available: " + available
                                                                + ", Requested: " + psr.getQuantityToShip());
                        }
                }

                // Find unplanned pending shipments (PENDING_COMPLETION without
                // plannedShipmentDate)
                // Planned shipments should not be modified - create new shipment instead
                Shipment unplannedPendingShipment = pendingShipments.stream()
                                .filter(s -> s.getPlannedShipmentDate() == null)
                                .findFirst()
                                .orElse(null);

                // Use existing unplanned pending shipment or create new one
                Shipment shipment;
                boolean isNewShipment;

                if (unplannedPendingShipment != null) {
                        // Add to existing unplanned pending shipment
                        shipment = unplannedPendingShipment;
                        isNewShipment = false;
                        log.info("Adding items to existing unplanned pending shipment {}", shipment.getId());
                } else {
                        // Create new shipment (either no pending or all pending are already planned)
                        shipment = new Shipment();
                        shipment.setOrder(order);
                        shipment.setStatus(ShipmentStatus.PENDING_COMPLETION);
                        isNewShipment = true;
                        log.info("Creating new shipment for order {}", order.getOrderNo());
                }

                // Update notes if provided
                if (request.getNotes() != null && !request.getNotes().isEmpty()) {
                        String existingNotes = shipment.getDeliveryNotes();
                        if (existingNotes != null && !existingNotes.isEmpty()) {
                                shipment.setDeliveryNotes(existingNotes + "\n" + request.getNotes());
                        } else {
                                shipment.setDeliveryNotes(request.getNotes());
                        }
                }

                // Add items to shipment
                for (ProductShipmentRequest psr : request.getProductShipments()) {
                        OrderProduct op = orderProductRepository.findById(psr.getOrderProductId()).orElseThrow();

                        // Check if this product already exists in the shipment
                        ShipmentItem existingItem = shipment.getItems().stream()
                                        .filter(item -> item.getOrderProduct().getId().equals(op.getId()))
                                        .findFirst()
                                        .orElse(null);

                        if (existingItem != null) {
                                // Update existing item quantity
                                existingItem.setShippedQuantity(
                                                existingItem.getShippedQuantity() + psr.getQuantityToShip().intValue());
                                log.info("Updated shipment item for {} - new qty: {}",
                                                op.getProductName(), existingItem.getShippedQuantity());
                        } else {
                                // Create new item
                                ShipmentItem item = new ShipmentItem();
                                item.setShipment(shipment);
                                item.setOrderProduct(op);
                                item.setShippedQuantity(psr.getQuantityToShip().intValue());
                                shipment.getItems().add(item);
                                log.info("Added new shipment item for {} - qty: {}",
                                                op.getProductName(), psr.getQuantityToShip());
                        }
                }

                // Update order status
                order.setStatus(OrderStatus.PENDING_SHIPMENT_APPROVAL);
                shipmentRepository.save(shipment);
                orderRepository.save(order);

                // Log activity
                String productsInfo = request.getProductShipments().stream()
                                .map(psr -> {
                                        OrderProduct op = orderProductRepository.findById(psr.getOrderProductId())
                                                        .orElse(null);
                                        return op != null
                                                        ? op.getProductName() + " (" + psr.getQuantityToShip()
                                                                        + " adet)"
                                                        : "";
                                })
                                .filter(s -> !s.isEmpty())
                                .reduce((a, b) -> a + ", " + b)
                                .orElse("ürünler");

                String activityMessage = isNewShipment
                                ? "Sevk talebi oluşturuldu: " + productsInfo
                                : "Mevcut sevk talebine eklendi: " + productsInfo;

                orderActivityService.logActivity(order, ActivityType.SHIPMENT_CREATED, activityMessage);
        }

        /**
         * Create a shipment from a sale
         */
        @Transactional
        public void createSaleShipment(SaleShipmentRequest request, UUID userId) {
                Sale sale = saleRepository.findById(request.getSaleId())
                                .orElseThrow(() -> new NotFoundException("Sale not found"));

                // Validation: Only available quantities can be shipped
                for (SaleProductShipmentRequest spsr : request.getProductShipments()) {
                        SaleProduct sp = saleProductRepository.findById(spsr.getSaleProductId())
                                        .orElseThrow(() -> new NotFoundException("Sale product not found"));

                        BigDecimal available = sp.getRemainingShipQuantity();

                        if (spsr.getQuantityToShip().compareTo(available) > 0) {
                                throw new BadRequestException(
                                                "Cannot ship more than available quantity for product: "
                                                                + sp.getProduct().getName());
                        }
                }

                // Create shipment
                Shipment shipment = new Shipment();
                shipment.setSale(sale);
                shipment.setStatus(ShipmentStatus.PENDING_COMPLETION);
                shipment.setDeliveryNotes(request.getNotes());
                shipment.setPlannedShipmentDate(LocalDateTime.now());

                for (SaleProductShipmentRequest spsr : request.getProductShipments()) {
                        SaleProduct sp = saleProductRepository.findById(spsr.getSaleProductId()).orElseThrow();

                        ShipmentItem item = new ShipmentItem();
                        item.setShipment(shipment);
                        item.setSaleProduct(sp);
                        item.setShippedQuantity(spsr.getQuantityToShip().intValue());
                        item.setItemType(ShipmentItemType.SALE_PRODUCT);
                        shipment.getItems().add(item);

                        // Update SaleProduct shippedQuantity
                        BigDecimal currentShipped = sp.getShippedQuantity() != null ? sp.getShippedQuantity()
                                        : BigDecimal.ZERO;
                        sp.setShippedQuantity(currentShipped.add(spsr.getQuantityToShip()));
                        saleProductRepository.save(sp);
                }

                // Request shipment approval
                sale.setStatus(SaleStatus.PENDING_SHIPMENT_APPROVAL);
                shipmentRepository.save(shipment);
                saleRepository.save(sale);

                // Log shipment creation
                String productsInfo = request.getProductShipments().stream()
                                .map(spsr -> {
                                        SaleProduct sp = saleProductRepository.findById(spsr.getSaleProductId())
                                                        .orElse(null);
                                        return sp != null
                                                        ? sp.getProduct().getName() + " (" + spsr.getQuantityToShip()
                                                                        + " adet)"
                                                        : "";
                                })
                                .filter(s -> !s.isEmpty())
                                .reduce((a, b) -> a + ", " + b)
                                .orElse("ürünler");

                log.info("Sale shipment created for sale {}: {}", sale.getSaleNo(), productsInfo);
        }

        /**
         * Get list of completed shipments awaiting final approval
         */
        @Transactional
        public List<ShipmentResponse> getCompletedAwaitingApproval() {
                return shipmentRepository.findByStatus(ShipmentStatus.COMPLETED).stream()
                                .map(this::toShipmentResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Get list of approved/finalized shipments
         */
        @Transactional
        public List<ShipmentResponse> getApprovedShipments() {
                log.info("Fetching approved shipments...");
                List<Shipment> shipments = shipmentRepository.findByStatus(ShipmentStatus.APPROVED);
                log.info("Found {} approved shipments", shipments.size());

                List<ShipmentResponse> responses = new ArrayList<>();
                for (Shipment shipment : shipments) {
                        try {
                                log.debug("Converting shipment {} to response", shipment.getId());
                                ShipmentResponse response = toShipmentResponse(shipment);
                                responses.add(response);
                        } catch (Exception e) {
                                log.error("Error converting shipment {} to response: {}", shipment.getId(),
                                                e.getMessage(), e);
                                // Continue processing other shipments
                        }
                }

                log.info("Returning {} shipment responses", responses.size());
                return responses;
        }

        /**
         * Calculate shipment progress for an order
         */
        public ShipmentProgressResponse getOrderShipmentProgress(UUID orderId) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                int totalProducts = order.getProducts().stream()
                                .mapToInt(op -> op.getQuantity().intValue())
                                .sum();

                int shippedProducts = order.getProducts().stream()
                                .mapToInt(op -> op.getShippedQuantity() != null ? op.getShippedQuantity().intValue()
                                                : 0)
                                .sum();

                List<Shipment> shipments = shipmentRepository.findByOrderId(orderId);
                long pendingShipments = shipments.stream()
                                .filter(s -> s.getStatus() != ShipmentStatus.APPROVED)
                                .count();

                double percentComplete = totalProducts > 0
                                ? (double) shippedProducts / totalProducts * 100.0
                                : 0.0;

                return ShipmentProgressResponse.builder()
                                .totalProducts(totalProducts)
                                .shippedProducts(shippedProducts)
                                .percentComplete(Math.round(percentComplete * 100.0) / 100.0)
                                .shipmentsCount(shipments.size())
                                .pendingShipments((int) pendingShipments)
                                .build();
        }

        /**
         * Calculate shipment progress for a sale
         */
        public ShipmentProgressResponse getSaleShipmentProgress(UUID saleId) {
                Sale sale = saleRepository.findById(saleId)
                                .orElseThrow(() -> new NotFoundException("Sale not found"));

                int totalProducts = sale.getProducts().stream()
                                .mapToInt(sp -> sp.getQuantity())
                                .sum();

                int shippedProducts = sale.getProducts().stream()
                                .mapToInt(sp -> sp.getShippedQuantity() != null ? sp.getShippedQuantity().intValue()
                                                : 0)
                                .sum();

                List<Shipment> shipments = shipmentRepository.findBySaleId(saleId);
                long pendingShipments = shipments.stream()
                                .filter(s -> s.getStatus() != ShipmentStatus.APPROVED)
                                .count();

                double percentComplete = totalProducts > 0
                                ? (double) shippedProducts / totalProducts * 100.0
                                : 0.0;

                return ShipmentProgressResponse.builder()
                                .totalProducts(totalProducts)
                                .shippedProducts(shippedProducts)
                                .percentComplete(Math.round(percentComplete * 100.0) / 100.0)
                                .shipmentsCount(shipments.size())
                                .pendingShipments((int) pendingShipments)
                                .build();
        }

        /**
         * Get signed document resource
         */
        public ResponseEntity<org.springframework.core.io.Resource> getSignedDocument(UUID shipmentId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                String path = shipment.getSignedDocumentPath();
                if (path == null) {
                        throw new NotFoundException("No signed document found for this shipment");
                }

                java.io.InputStream inputStream = storageService.download(path);
                org.springframework.core.io.InputStreamResource resource = new org.springframework.core.io.InputStreamResource(
                                inputStream);

                String filename = path.substring(path.lastIndexOf("/") + 1);
                String contentType = "application/octet-stream";
                if (filename.toLowerCase().endsWith(".pdf")) {
                        contentType = "application/pdf";
                } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                        contentType = "image/jpeg";
                } else if (filename.toLowerCase().endsWith(".png")) {
                        contentType = "image/png";
                }

                return ResponseEntity.ok()
                                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                                                "inline; filename=\"" + filename + "\"")
                                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                                .body(resource);
        }

        /**
         * Update delivery details (notes and additional photos) before final approval
         */
        @Transactional
        public void updateDeliveryDetails(UUID shipmentId, DeliveryDetailsUpdateRequest request,
                        List<MultipartFile> additionalPhotos) throws Exception {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                if (shipment.getStatus() != ShipmentStatus.COMPLETED) {
                        throw new BadRequestException("Can only update delivery details for completed shipments");
                }

                // Update notes
                if (request.getDeliveryNotes() != null) {
                        shipment.setDeliveryNotes(request.getDeliveryNotes());
                }

                // Add additional photos
                if (additionalPhotos != null && !additionalPhotos.isEmpty()) {
                        List<String> existingPhotos = shipment.getDeliveryPhotoPaths();
                        if (existingPhotos == null) {
                                existingPhotos = new ArrayList<>();
                        }

                        for (MultipartFile photo : additionalPhotos) {
                                if (!photo.isEmpty()) {
                                        String photoPath = storageService.store(photo, "shipment-photos");
                                        existingPhotos.add(photoPath);
                                }
                        }
                        shipment.setDeliveryPhotoPaths(existingPhotos);
                }

                shipmentRepository.save(shipment);
        }

        private ShipmentResponse toShipmentResponse(Shipment shipment) {
                log.debug("toShipmentResponse: Processing shipment {}", shipment.getId());
                UUID orderId = null;
                String orderNo = null;
                String customerName = null;
                LocalDate orderDate = null;

                try {
                        log.debug("toShipmentResponse: Accessing order for shipment {}", shipment.getId());
                        if (shipment.getOrder() != null) {
                                orderId = shipment.getOrder().getId();
                                orderNo = shipment.getOrder().getOrderNo();
                                if (shipment.getOrder().getCustomer() != null) {
                                        customerName = shipment.getOrder().getCustomer().getFirstName() + " "
                                                        + shipment.getOrder().getCustomer().getLastName();
                                }
                                orderDate = shipment.getOrder().getOrderDate();
                                log.debug("toShipmentResponse: Order loaded - ID: {}, No: {}", orderId, orderNo);
                        }
                } catch (Exception e) {
                        log.warn("Could not load order for shipment {}: {}", shipment.getId(), e.getMessage());
                }

                UUID shippedById = null;
                String shippedByName = null;
                try {
                        log.debug("toShipmentResponse: Accessing shippedBy for shipment {}", shipment.getId());
                        if (shipment.getShippedBy() != null) {
                                shippedById = shipment.getShippedBy().getId();
                                shippedByName = shipment.getShippedBy().getFirstName() + " "
                                                + shipment.getShippedBy().getLastName();
                                log.debug("toShipmentResponse: ShippedBy loaded - {}", shippedByName);
                        }
                } catch (Exception e) {
                        log.warn("Could not load shippedBy for shipment {}: {}", shipment.getId(), e.getMessage());
                }

                UUID approvedById = null;
                String approvedByName = null;
                try {
                        log.debug("toShipmentResponse: Accessing approvedBy for shipment {}", shipment.getId());
                        if (shipment.getApprovedBy() != null) {
                                approvedById = shipment.getApprovedBy().getId();
                                approvedByName = shipment.getApprovedBy().getFirstName() + " "
                                                + shipment.getApprovedBy().getLastName();
                                log.debug("toShipmentResponse: ApprovedBy loaded - {}", approvedByName);
                        }
                } catch (Exception e) {
                        log.warn("Could not load approvedBy for shipment {}: {}", shipment.getId(), e.getMessage());
                }

                List<String> deliveryPhotoUrls = new ArrayList<>();
                try {
                        log.debug("toShipmentResponse: Accessing deliveryPhotoPaths for shipment {}", shipment.getId());
                        if (shipment.getDeliveryPhotoPaths() != null) {
                                // Force initialization by creating a new list
                                deliveryPhotoUrls = new ArrayList<>(shipment.getDeliveryPhotoPaths());
                                log.debug("toShipmentResponse: deliveryPhotoPaths loaded - count: {}",
                                                deliveryPhotoUrls.size());
                        }
                } catch (Exception e) {
                        log.warn("Could not load deliveryPhotoPaths for shipment {}: {}", shipment.getId(),
                                        e.getMessage());
                }

                log.debug("toShipmentResponse: Building response for shipment {}", shipment.getId());
                return ShipmentResponse.builder()
                                .id(shipment.getId())
                                .orderId(orderId)
                                .orderNo(orderNo)
                                .customerName(customerName)
                                .orderDate(orderDate)
                                .plannedShipmentDate(shipment.getPlannedShipmentDate())
                                .actualShipmentDate(shipment.getActualShipmentDate())
                                .shippedById(shippedById)
                                .shippedByName(shippedByName)
                                .deliveryStatus(shipment.getDeliveryStatus())
                                .problemType(shipment.getProblemType())
                                .deliveryNotes(shipment.getDeliveryNotes())
                                .signedDocumentUrl(shipment.getSignedDocumentPath())
                                .deliveryPhotoUrls(deliveryPhotoUrls)
                                .status(shipment.getStatus())
                                .approvedById(approvedById)
                                .approvedByName(approvedByName)
                                .approvalDate(shipment.getApprovalDate())
                                .build();
        }
}
