package com.stokmate.service;

import com.stokmate.domain.ActivityType;
import org.springframework.http.ResponseEntity;
import com.stokmate.domain.ApprovalStatus;
import com.stokmate.domain.Customer;
import com.stokmate.domain.Order;
import com.stokmate.domain.OrderProduct;
import com.stokmate.domain.OrderStatus;
import com.stokmate.domain.OrderType;
import com.stokmate.domain.Sale;
import com.stokmate.domain.SaleProduct;
import com.stokmate.domain.SaleStatus;
import com.stokmate.domain.Shipment;
import com.stokmate.domain.ShipmentItem;
import com.stokmate.domain.ShipmentItemType;
import com.stokmate.domain.ShipmentStatus;
import com.stokmate.domain.User;
import com.stokmate.domain.Vehicle;
import com.stokmate.domain.ProblemResolutionType;
import com.stokmate.dto.shipment.DeliveryDetailsUpdateRequest;
import com.stokmate.dto.shipment.PartialShipmentRequest;
import com.stokmate.dto.shipment.PlannedShipmentRequest;
import com.stokmate.dto.shipment.ProductShipmentRequest;
import com.stokmate.dto.shipment.ResolveProblemRequest;
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
        private final com.stokmate.repository.SaleProductAllocationRepository saleProductAllocationRepository;
        private final com.stokmate.repository.ProductEventRepository productEventRepository;

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
                shipment.setStatus(ShipmentStatus.PENDING);
                shipment.setApprovedBy(approver);
                shipment.setApprovalDate(LocalDateTime.now());

                // Create ShipmentItems for all accepted products in the order
                for (OrderProduct orderProduct : order.getProducts()) {
                        BigDecimal acceptedQty = orderProduct.getAcceptedQuantity() != null
                                        ? orderProduct.getAcceptedQuantity()
                                        : BigDecimal.ZERO;
                        BigDecimal alreadyShipped = orderProduct.getShippedQuantity() != null
                                        ? orderProduct.getShippedQuantity()
                                        : BigDecimal.ZERO;
                        BigDecimal toShip = acceptedQty.subtract(alreadyShipped);

                        if (toShip.compareTo(BigDecimal.ZERO) > 0) {
                                ShipmentItem item = new ShipmentItem();
                                item.setShipment(shipment);
                                item.setOrderProduct(orderProduct);
                                item.setShippedQuantity(toShip.intValue());
                                shipment.addItem(item);
                        }
                }

                shipmentRepository.save(shipment);

                // Log activity
                orderActivityService.logActivity(order, ActivityType.SHIPMENT_APPROVED,
                                "Sevk onayı verildi - Sevkiyat oluşturuldu");

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
                                        .alternatePhone(c.getAlternatePhone())
                                        .address(formatCustomerAddress(c))
                                        .build();
                } else if (order.getProsapContractNameSurname() != null) {
                        customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                        .name(order.getProsapContractNameSurname())
                                        .phone("")
                                        .alternatePhone("")
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

                // Build linked SSH order info
                String linkedSshOrderId = null;
                String linkedSshOrderNo = null;
                String linkedSshOrderStatus = null;
                if (shipment != null && shipment.getLinkedSshOrder() != null) {
                        Order sshOrder = shipment.getLinkedSshOrder();
                        linkedSshOrderId = sshOrder.getId().toString();
                        linkedSshOrderNo = sshOrder.getOrderNo();
                        linkedSshOrderStatus = sshOrder.getStatus().getDisplayName();
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
                                .shipmentNote(order.getShipmentNote())
                                .deliveryStatus(shipment != null && shipment.getDeliveryStatus() != null
                                                ? shipment.getDeliveryStatus().toString()
                                                : null)
                                .problemType(shipment != null && shipment.getProblemType() != null
                                                ? shipment.getProblemType().toString()
                                                : null)
                                .deliveryNotes(shipment != null ? shipment.getDeliveryNotes() : null)
                                .signedDocumentUrl(shipment != null ? shipment.getSignedDocumentPath() : null)
                                .deliveryPhotoUrls(shipment != null && shipment.getDeliveryPhotoPaths() != null
                                                ? new ArrayList<>(shipment.getDeliveryPhotoPaths())
                                                : null)
                                .problemResolved(shipment != null && shipment.isProblemResolved())
                                .resolutionType(shipment != null && shipment.getResolutionType() != null
                                                ? shipment.getResolutionType().toString()
                                                : null)
                                .resolutionDescription(
                                                shipment != null ? shipment.getResolutionDescription() : null)
                                .resolutionPhotoUrls(
                                                shipment != null && shipment.getResolutionPhotoPaths() != null
                                                                ? new ArrayList<>(shipment.getResolutionPhotoPaths())
                                                                : null)
                                .resolvedAt(shipment != null ? shipment.getResolvedAt() : null)
                                .resolvedByName(shipment != null && shipment.getResolvedBy() != null
                                                ? shipment.getResolvedBy().getFirstName() + " "
                                                                + shipment.getResolvedBy().getLastName()
                                                : null)
                                .linkedSshOrderId(linkedSshOrderId)
                                .linkedSshOrderNo(linkedSshOrderNo)
                                .linkedSshOrderStatus(linkedSshOrderStatus)
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
                Sale sale = shipment.getSale();

                ShipmentDetailsResponse.CustomerInfo customerInfo = null;
                ShipmentDetailsResponse.UserInfo consultantInfo = null;
                String orderNoVal = null;
                String saleNoVal = null;
                String shipmentTypeVal = "UNKNOWN";
                java.time.LocalDateTime dateVal = null;
                String contractNoVal = null;

                if (order != null) {
                        orderNoVal = order.getOrderNo();
                        shipmentTypeVal = "ORDER";
                        dateVal = java.time.LocalDateTime.ofInstant(order.getCreatedAt(),
                                        java.time.ZoneId.systemDefault());
                        contractNoVal = order.getProsapContractNo();

                        if (order.getCustomer() != null) {
                                Customer c = order.getCustomer();
                                customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                                .name(c.getFirstName() + " " + c.getLastName())
                                                .phone(c.getPhone())
                                                .alternatePhone(c.getAlternatePhone())
                                                .address(formatCustomerAddress(c))
                                                .build();
                        } else if (order.getProsapContractNameSurname() != null) {
                                customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                                .name(order.getProsapContractNameSurname())
                                                .phone("")
                                                .alternatePhone("")
                                                .address("")
                                                .build();
                        }

                        if (order.getSalesConsultant() != null) {
                                consultantInfo = ShipmentDetailsResponse.UserInfo.builder()
                                                .id(order.getSalesConsultant().getId().toString())
                                                .name(order.getSalesConsultant().getFirstName() + " "
                                                                + order.getSalesConsultant().getLastName())
                                                .build();
                        }
                } else if (sale != null) {
                        saleNoVal = sale.getSaleNo();
                        shipmentTypeVal = "SALE";
                        dateVal = sale.getSaleDate().atStartOfDay();
                        contractNoVal = sale.getContractNo();

                        if (sale.getCustomer() != null) {
                                Customer c = sale.getCustomer();
                                customerInfo = ShipmentDetailsResponse.CustomerInfo.builder()
                                                .name(c.getFirstName() + " " + c.getLastName())
                                                .phone(c.getPhone())
                                                .alternatePhone(c.getAlternatePhone())
                                                .address(formatCustomerAddress(c))
                                                .build();
                        }
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
                                        if (si.getOrderProduct() != null) {
                                                OrderProduct op = si.getOrderProduct();
                                                int totalQty = op.getQuantity().intValue();
                                                int shippedQty = op.getShippedQuantity() != null
                                                                ? op.getShippedQuantity().intValue()
                                                                : 0;
                                                int pendingQty = si.getShippedQuantity();
                                                int remainingQty = Math.max(0, totalQty - shippedQty);

                                                return ShipmentDetailsResponse.ProductShipmentDetail.builder()
                                                                .productCode(op.getProductCode())
                                                                .productName(op.getProductName())
                                                                .totalQuantity(totalQty)
                                                                .shippedQuantity(shippedQty)
                                                                .pendingQuantity(pendingQty)
                                                                .remainingQuantity(remainingQty)
                                                                .build();
                                        } else if (si.getSaleProduct() != null) {
                                                SaleProduct sp = si.getSaleProduct();
                                                int totalQty = sp.getQuantity().intValue();
                                                int shippedQty = sp.getShippedQuantity() != null
                                                                ? sp.getShippedQuantity().intValue()
                                                                : 0;
                                                int pendingQty = si.getShippedQuantity();
                                                int remainingQty = Math.max(0, totalQty - shippedQty);

                                                return ShipmentDetailsResponse.ProductShipmentDetail.builder()
                                                                .productCode(sp.getProduct().getCode())
                                                                .productName(sp.getProduct().getName())
                                                                .totalQuantity(totalQty)
                                                                .shippedQuantity(shippedQty)
                                                                .pendingQuantity(pendingQty)
                                                                .remainingQuantity(remainingQty)
                                                                .build();
                                        }
                                        return null;
                                })
                                .filter(java.util.Objects::nonNull)
                                .collect(Collectors.toList());

                // Build linked SSH order info
                String linkedSshOrderId = null;
                String linkedSshOrderNo = null;
                String linkedSshOrderStatus = null;
                if (shipment.getLinkedSshOrder() != null) {
                        Order sshOrder = shipment.getLinkedSshOrder();
                        linkedSshOrderId = sshOrder.getId().toString();
                        linkedSshOrderNo = sshOrder.getOrderNo();
                        linkedSshOrderStatus = sshOrder.getStatus().getDisplayName();
                }

                return ShipmentDetailsResponse.builder()
                                .orderId(order != null ? order.getId().toString()
                                                : (sale != null ? sale.getId().toString() : null))
                                .saleId(sale != null ? sale.getId().toString() : null)
                                .shipmentId(shipment.getId().toString())
                                .orderNo(orderNoVal)
                                .saleNo(saleNoVal)
                                .orderType(shipmentTypeVal)
                                .shipmentType(shipmentTypeVal)
                                .orderDate(dateVal)
                                .contractNo(contractNoVal)
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
                                .shipmentNote(order != null ? order.getShipmentNote() : null)
                                .deliveryNotes(shipment.getDeliveryNotes())
                                .signedDocumentUrl(shipment.getSignedDocumentPath())
                                .deliveryPhotoUrls(shipment.getDeliveryPhotoPaths() != null
                                                ? new ArrayList<>(shipment.getDeliveryPhotoPaths())
                                                : null)
                                .problemResolved(shipment.isProblemResolved())
                                .resolutionType(shipment.getResolutionType() != null
                                                ? shipment.getResolutionType().toString()
                                                : null)
                                .resolutionDescription(shipment.getResolutionDescription())
                                .resolutionPhotoUrls(shipment.getResolutionPhotoPaths() != null
                                                ? new ArrayList<>(shipment.getResolutionPhotoPaths())
                                                : null)
                                .resolvedAt(shipment.getResolvedAt())
                                .resolvedByName(shipment.getResolvedBy() != null
                                                ? shipment.getResolvedBy().getFirstName() + " "
                                                                + shipment.getResolvedBy().getLastName()
                                                : null)
                                .linkedSshOrderId(linkedSshOrderId)
                                .linkedSshOrderNo(linkedSshOrderNo)
                                .linkedSshOrderStatus(linkedSshOrderStatus)
                                .build();
        }

        /**
         * Plan shipment with driver and vehicle (driver is current user by default)
         */
        @Transactional
        public void planShipment(UUID shipmentId, PlannedShipmentRequest request, UUID currentUserId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                // Validate Status
                if (shipment.getStatus() == ShipmentStatus.PENDING) {
                        throw new BadRequestException("Shipment must be approved before planning");
                }

                if (shipment.getStatus() == ShipmentStatus.COMPLETED
                                || shipment.getStatus() == ShipmentStatus.FINALIZED) {
                        throw new BadRequestException("Cannot plan a completed or finalized shipment");
                }

                Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                                .orElseThrow(() -> new NotFoundException("Vehicle not found"));

                UUID driverIdToUse = request.getDriverId() != null ? request.getDriverId() : currentUserId;
                User driver = userRepository.findById(driverIdToUse)
                                .orElseThrow(() -> new NotFoundException("Driver not found"));

                // Set status to PLANNED when planning
                shipment.setStatus(ShipmentStatus.PLANNED);
                shipment.setPlannedShipmentDate(request.getPlannedDate());
                shipment.setVehicle(vehicle);
                shipment.setShippedBy(driver);
                shipmentRepository.save(shipment);

                // Log activity
                if (shipment.getOrder() != null) {
                        orderActivityService.logActivity(shipment.getOrder(), ActivityType.SHIPMENT_CREATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sevk planlandı - Tarih: "
                                                        + request.getPlannedDate() + ", Plaka: "
                                                        + vehicle.getLicensePlate());
                }
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
                                "[Sevk #" + shipment.getId().toString().substring(0, 8) + "] Şoför değiştirildi: "
                                                + oldDriverName + " -> " + newDriverName);
        }

        /**
         * Update shipment vehicle (ADMIN/MANAGER only)
         */
        @Transactional
        public void updateShipmentVehicle(UUID shipmentId, com.stokmate.dto.shipment.UpdateVehicleRequest request) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                Vehicle newVehicle = vehicleRepository.findById(request.getVehicleId())
                                .orElseThrow(() -> new NotFoundException("Vehicle not found"));

                Vehicle oldVehicle = shipment.getVehicle();
                shipment.setVehicle(newVehicle);
                shipmentRepository.save(shipment);

                // Log activity
                String oldPlate = oldVehicle != null ? oldVehicle.getLicensePlate() : "Atanmamış";
                String newPlate = newVehicle.getLicensePlate();

                if (shipment.getOrder() != null) {
                        orderActivityService.logActivity(shipment.getOrder(), ActivityType.SHIPMENT_CREATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Araç değiştirildi: "
                                                        + oldPlate + " -> " + newPlate);
                }
        }

        /**
         * Update shipment driver by Shipment ID (ADMIN/MANAGER only)
         */
        @Transactional
        public void updateShipmentDriverById(UUID shipmentId, UpdateDriverRequest request) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

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

                if (shipment.getOrder() != null) {
                        orderActivityService.logActivity(shipment.getOrder(), ActivityType.SHIPMENT_CREATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Şoför değiştirildi: "
                                                        + oldDriverName + " -> " + newDriverName);
                }
        }

        /**
         * Get shipments ready for shipment (PLANNED status)
         */
        @Transactional
        public List<ShipmentResponse> getReadyForShipment() {
                return shipmentRepository.findByStatus(ShipmentStatus.PLANNED).stream()
                                .map(this::toShipmentResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Get shipments awaiting initial approval (PENDING status)
         */
        @Transactional
        public List<ShipmentResponse> getPendingApprovals() {
                return shipmentRepository.findByStatus(ShipmentStatus.PENDING).stream()
                                .map(this::toShipmentResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Get shipments approved and awaiting planning (APPROVED status)
         */
        @Transactional
        public List<ShipmentResponse> getAwaitingPlanningShipments() {
                return shipmentRepository.findByStatus(ShipmentStatus.APPROVED).stream()
                                .map(this::toShipmentResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Approve a PENDING shipment (first approval step)
         * Changes status from PENDING to APPROVED
         */
        @Transactional
        public ShipmentResponse approveInitialShipment(UUID shipmentId, UUID approverId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                if (shipment.getStatus() != ShipmentStatus.PENDING) {
                        throw new BadRequestException("Shipment is not pending approval");
                }

                User approver = userRepository.findById(approverId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                shipment.setStatus(ShipmentStatus.APPROVED);
                shipmentRepository.save(shipment);

                // Log activity
                if (shipment.getOrder() != null) {
                        orderActivityService.logActivity(shipment.getOrder(), ActivityType.SHIPMENT_APPROVED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sevk onaylandı - Onaylayan: "
                                                        + approver.getFirstName() + " " + approver.getLastName());
                }

                return toShipmentResponse(shipment);
        }

        @Transactional
        public ShipmentResponse completeShipment(ShipmentCompletionRequest request, UUID shippedById) throws Exception {
                Shipment shipment = shipmentRepository.findById(request.getShipmentId())
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                User shippedBy = userRepository.findById(shippedById)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                // Update shipment details
                shipment.setActualShipmentDate(request.getActualShipmentDate() != null ? request.getActualShipmentDate()
                                : LocalDateTime.now());
                shipment.setShippedBy(shippedBy);
                shipment.setDeliveryStatus(request.getDeliveryStatus());
                shipment.setProblemType(request.getProblemType());
                shipment.setDeliveryNotes(request.getDeliveryNotes());
                shipment.setReceiverName(request.getReceiverName());
                shipment.setStatus(ShipmentStatus.COMPLETED);

                // Upload files
                if (request.getSignedDocument() != null && !request.getSignedDocument().isEmpty()) {
                        String signedDocPath = storageService.store(request.getSignedDocument(), "shipment-documents");
                        shipment.setSignedDocumentPath(signedDocPath);
                }

                if (request.getDeliveryPhotos() != null && !request.getDeliveryPhotos().isEmpty()) {
                        java.util.Set<String> photoPaths = new java.util.HashSet<>();
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

                // Flush to ensure all shippedQuantity updates are persisted before checking
                // order completion
                orderProductRepository.flush();

                User finalizer = userRepository.findById(finalizerId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                Order order = shipment.getOrder();

                // Handle Sale-based shipments
                if (shipment.getSale() != null) {
                        Sale sale = shipment.getSale();

                        // Update shipped quantities for sale products and create FIFO ProductEvents
                        for (ShipmentItem item : shipment.getItems()) {
                                if (item.getSaleProduct() != null) {
                                        SaleProduct sp = item.getSaleProduct();
                                        BigDecimal currentShipped = sp.getShippedQuantity() != null
                                                        ? sp.getShippedQuantity()
                                                        : BigDecimal.ZERO;
                                        sp.setShippedQuantity(
                                                        currentShipped.add(
                                                                        BigDecimal.valueOf(item.getShippedQuantity())));
                                        saleProductRepository.save(sp);

                                        // Create ProductEvents using FIFO allocation records
                                        List<com.stokmate.domain.SaleProductAllocation> allocations = saleProductAllocationRepository
                                                        .findBySaleProductId(sp.getId());
                                        for (com.stokmate.domain.SaleProductAllocation alloc : allocations) {
                                                com.stokmate.domain.ProductPriceHistory history = alloc
                                                                .getProductPriceHistory();
                                                com.stokmate.domain.Product product = history.getProduct();

                                                com.stokmate.domain.ProductEvent event = new com.stokmate.domain.ProductEvent();
                                                event.setProduct(product);
                                                event.setEventType("STOCK_OUT");
                                                event.setQuantityChange(alloc.getQuantity().negate());
                                                event.setPriceAtEvent(history.getNetPrice());
                                                event.setDescription("Satış için stok çıkışı - " + product.getName() +
                                                                " x " + alloc.getQuantity() + " adet @ "
                                                                + history.getNetPrice() +
                                                                " TL - Satış No: " + sale.getSaleNo());
                                                event.setCreatedBy(finalizer);
                                                productEventRepository.save(event);
                                        }
                                }
                        }
                        saleProductRepository.flush();

                        // Check if all sale products are shipped
                        boolean allProductsShipped = sale.getProducts().stream()
                                        .allMatch(sp -> {
                                                BigDecimal shipped = sp.getShippedQuantity() != null
                                                                ? sp.getShippedQuantity()
                                                                : BigDecimal.ZERO;
                                                BigDecimal quantity = BigDecimal.valueOf(sp.getQuantity());
                                                return shipped.compareTo(quantity) >= 0;
                                        });

                        if (allProductsShipped) {
                                sale.setStatus(com.stokmate.domain.SaleStatus.TAMAMLANDI);
                        }
                        saleRepository.save(sale);
                }

                // Set approver and approval date
                shipment.setApprovedBy(finalizer);
                shipment.setApprovalDate(LocalDateTime.now());
                shipment.setStatus(ShipmentStatus.FINALIZED);
                shipmentRepository.save(shipment);

                // Check and auto-complete order if all products shipped (only for Order-based
                // shipments)
                if (order != null) {
                        orderService.checkAndCompleteOrder(order.getId());

                        // Log activity for Order
                        String statusText = shipment.getDeliveryStatus() != null
                                        ? (shipment.getDeliveryStatus().toString().equals("PROBLEM_FREE") ? "Sorunsuz"
                                                        : "Sorunlu")
                                        : "Bilinmeyen";
                        orderActivityService.logActivity(order, ActivityType.SHIPMENT_APPROVED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sevk onaylandı ve tamamlandı (" + statusText
                                                        + " teslimat) - Onaylayan: "
                                                        + finalizer.getFirstName() + " " + finalizer.getLastName());
                }

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

                // Find active shipments that candidates for merging (PENDING or APPROVED)
                // PLANNED, COMPLETED, FINALIZED are not mergeable
                List<Shipment> mergeableShipments = shipmentRepository.findByOrder(order).stream()
                                .filter(s -> s.getStatus() == ShipmentStatus.PENDING
                                                || s.getStatus() == ShipmentStatus.APPROVED)
                                .collect(Collectors.toList());

                // Get all active shipments for calculation (non-finalized + finalized)
                // Actually to calculate 'pendingInShipments', we should look at all shipments
                // that haven't been cancelled (if cancellation exists)
                // Here we look at everything except FINALIZED? No, we need everything to
                // subtract from accepted.
                // But generally FINALIZED/COMPLETED items are 'shipped'.
                // The logic below (lines 689-693) sums up quantities in 'activeShipments'.
                // If a shipment is FINALIZED, its quantity is already moved to
                // orderProduct.shippedQuantity?
                // Let's check finalizeShipment (lines 599-600). Yes, shippedQuantity is updated
                // there.
                // So FINALIZED shipments should NOT be included in pending calculation.
                // But COMPLETED, PLANNED, APPROVED, PENDING should be included.

                List<Shipment> activeShipments = shipmentRepository.findByOrder(order).stream()
                                .filter(s -> s.getStatus() != ShipmentStatus.FINALIZED)
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

                // Find mergeable shipment (PENDING or APPROVED)
                Shipment mergeableShipment = mergeableShipments.stream()
                                .findFirst()
                                .orElse(null);

                // Use existing mergeable shipment or create new one
                Shipment shipment;
                boolean isNewShipment;

                if (mergeableShipment != null) {
                        // Add to existing shipment
                        shipment = mergeableShipment;
                        isNewShipment = false;
                        log.info("Adding items to existing shipment {} with status {}", shipment.getId(),
                                        shipment.getStatus());
                } else {
                        // Create new shipment (either no pending or all pending are already planned)
                        shipment = new Shipment();
                        shipment.setOrder(order);
                        shipment.setStatus(ShipmentStatus.PENDING);
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
                                ? "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                + "] Sevk talebi oluşturuldu: " + productsInfo
                                : "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                + "] Mevcut sevk talebine eklendi: " + productsInfo;

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
                shipment.setStatus(ShipmentStatus.PENDING); // Direkt onaya git, tarih planlama aşamasında girilecek
                shipment.setDeliveryNotes(request.getNotes());
                // Tarih girilmez, planlama aşamasında set edilecek

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
                List<Shipment> shipments = shipmentRepository.findByStatus(ShipmentStatus.FINALIZED);
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
                                .filter(s -> s.getStatus() != ShipmentStatus.FINALIZED)
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
                                .filter(s -> s.getStatus() != ShipmentStatus.FINALIZED)
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
                        java.util.Set<String> existingPhotos = shipment.getDeliveryPhotoPaths();
                        if (existingPhotos == null) {
                                existingPhotos = new java.util.HashSet<>();
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

        /**
         * List all shipments (paginated) with status group, search and delivery status
         */
        @Transactional
        public org.springframework.data.domain.Page<ShipmentResponse> listPaged(
                        String statusGroup, String search, String deliveryFilter, String brand,
                        String problemResolved,
                        org.springframework.data.domain.Pageable pageable) {
                String searchParam = null;
                if (search != null && !search.isBlank()) {
                        searchParam = "%" + search.toLowerCase() + "%";
                }
                String brandParam = (brand != null && !brand.isBlank()) ? brand : null;

                Boolean problemResolvedParam = null;
                if ("RESOLVED".equals(problemResolved)) {
                        problemResolvedParam = true;
                } else if ("UNRESOLVED".equals(problemResolved)) {
                        problemResolvedParam = false;
                }

                return shipmentRepository.findPagedWithFilters(statusGroup, searchParam, deliveryFilter, brandParam,
                                problemResolvedParam, pageable)
                                .map(this::toShipmentResponse);
        }

        private ShipmentResponse toShipmentResponse(Shipment shipment) {
                log.debug("toShipmentResponse: Processing shipment {}", shipment.getId());
                UUID orderId = null;
                String orderNo = null;
                String customerName = null;
                LocalDate orderDate = null;

                try {
                        log.debug("toShipmentResponse: Accessing order/sale for shipment {}", shipment.getId());
                        if (shipment.getOrder() != null) {
                                orderId = shipment.getOrder().getId();
                                orderNo = shipment.getOrder().getOrderNo();
                                if (shipment.getOrder().getCustomer() != null) {
                                        customerName = shipment.getOrder().getCustomer().getFirstName() + " "
                                                        + shipment.getOrder().getCustomer().getLastName();
                                }
                                orderDate = shipment.getOrder().getOrderDate();
                                log.debug("toShipmentResponse: Order loaded - ID: {}, No: {}", orderId, orderNo);
                        } else if (shipment.getSale() != null) {
                                // Map Sale details
                                orderId = shipment.getSale().getId(); // Reuse orderId field for compatibility or use
                                                                      // saleId
                                // ideally we populate saleId but let's populate generic fields too if needed
                                orderNo = shipment.getSale().getSaleNo(); // Reuse orderNo for display
                                if (shipment.getSale().getCustomer() != null) {
                                        customerName = shipment.getSale().getCustomer().getFirstName() + " " +
                                                        shipment.getSale().getCustomer().getLastName();
                                }
                                orderDate = shipment.getSale().getSaleDate();
                        }
                } catch (Exception e) {
                        log.warn("Could not load order/sale for shipment {}: {}", shipment.getId(), e.getMessage());
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

                // Extract brand from first product
                String brandStr = null;
                try {
                        if (shipment.getOrder() != null && shipment.getOrder().getProducts() != null) {
                                brandStr = shipment.getOrder().getProducts().stream()
                                                .filter(p -> p.getBrand() != null)
                                                .map(p -> p.getBrand().name())
                                                .findFirst()
                                                .orElse(null);
                        } else if (shipment.getSale() != null && shipment.getSale().getProducts() != null) {
                                brandStr = shipment.getSale().getProducts().stream()
                                                .filter(sp -> sp.getProduct() != null
                                                                && sp.getProduct().getBrand() != null)
                                                .map(sp -> sp.getProduct().getBrand().name())
                                                .findFirst()
                                                .orElse(null);
                        }
                } catch (Exception e) {
                        log.warn("Could not load brand for shipment {}: {}", shipment.getId(), e.getMessage());
                }

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
                                .saleId(shipment.getSale() != null ? shipment.getSale().getId() : null)
                                .saleNo(shipment.getSale() != null ? shipment.getSale().getSaleNo() : null)
                                .shipmentType(shipment.getOrder() != null ? "ORDER"
                                                : (shipment.getSale() != null ? "SALE" : "UNKNOWN"))
                                .brand(brandStr)
                                .problemResolved(shipment.isProblemResolved())
                                .build();
        }

        /**
         * Get calendar events (shipments) for a user based on their role
         */
        @Transactional
        public List<com.stokmate.dto.event.UserEventResponse> getCalendarEvents(User user, LocalDateTime start,
                        LocalDateTime end) {
                List<Shipment> shipments;

                if (user.getRole() == com.stokmate.domain.Role.STORE_MANAGER) {
                        String location = user.getLocation() != null ? user.getLocation() : "";
                        shipments = shipmentRepository.findStoreShipments(location, start, end);
                } else if (user.getRole() == com.stokmate.domain.Role.STORE_EMPLOYEE) {
                        shipments = shipmentRepository.findMyShipments(user.getId(), start, end);
                } else {
                        // Admin, Director, Manager, Logistics Manager, Operations Manager
                        shipments = shipmentRepository.findAllByPlannedShipmentDateBetween(start, end);
                }

                return shipments.stream()
                                .map(this::toUserEventResponse)
                                .collect(Collectors.toList());
        }

        private com.stokmate.dto.event.UserEventResponse toUserEventResponse(Shipment shipment) {
                com.stokmate.dto.event.UserEventResponse response = new com.stokmate.dto.event.UserEventResponse();
                response.setId(shipment.getId());

                String title = "Sevk: ";
                if (shipment.getOrder() != null) {
                        title += shipment.getOrder().getOrderNo();
                        if (shipment.getOrder().getCustomer() != null) {
                                title += " - " + shipment.getOrder().getCustomer().getFirstName() + " "
                                                + shipment.getOrder().getCustomer().getLastName();
                        } else if (shipment.getOrder().getProsapContractNameSurname() != null) {
                                title += " - " + shipment.getOrder().getProsapContractNameSurname();
                        }
                } else if (shipment.getSale() != null) {
                        title += shipment.getSale().getSaleNo();
                        if (shipment.getSale().getCustomer() != null) {
                                title += " - " + shipment.getSale().getCustomer().getFirstName() + " "
                                                + shipment.getSale().getCustomer().getLastName();
                        }
                }

                response.setTitle(title);

                StringBuilder desc = new StringBuilder();
                if (shipment.getVehicle() != null) {
                        desc.append("Araç: ").append(shipment.getVehicle().getLicensePlate()).append(" ");
                }
                if (shipment.getShippedBy() != null) {
                        desc.append("Şoför: ").append(shipment.getShippedBy().getFirstName()).append(" ")
                                        .append(shipment.getShippedBy().getLastName()).append(" ");
                }
                if (shipment.getDeliveryNotes() != null) {
                        desc.append("\nNot: ").append(shipment.getDeliveryNotes());
                }

                response.setDescription(desc.toString());
                response.setStartDateTime(shipment.getPlannedShipmentDate());
                if (shipment.getPlannedShipmentDate() != null) {
                        response.setEndDateTime(shipment.getPlannedShipmentDate().plusHours(1)); // Duration 1h default
                }
                response.setReminderType(com.stokmate.domain.ReminderType.HOUR_1_BEFORE); // Default reminder
                response.setNotified(false);
                response.setType("SHIPMENT");

                return response;
        }

        // =============== PROBLEM RESOLUTION METHODS ===============

        /**
         * Manually resolve a problematic shipment with description and photos
         */
        @Transactional
        public void resolveShipmentProblem(ResolveProblemRequest request, UUID userId) throws Exception {
                Shipment shipment = shipmentRepository.findById(request.getShipmentId())
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                if (shipment.getDeliveryStatus() == null
                                || shipment.getDeliveryStatus() != com.stokmate.domain.DeliveryStatus.PROBLEMATIC) {
                        throw new BadRequestException("Bu sevkiyat sorunlu olarak işaretlenmemiş");
                }

                if (shipment.isProblemResolved()) {
                        throw new BadRequestException("Bu sevkiyatın sorunu zaten çözülmüş");
                }

                User resolver = userRepository.findById(userId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                shipment.setProblemResolved(true);
                shipment.setResolutionType(ProblemResolutionType.MANUAL);
                shipment.setResolutionDescription(request.getDescription());
                shipment.setResolvedAt(LocalDateTime.now());
                shipment.setResolvedBy(resolver);

                if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
                        java.util.Set<String> photoPaths = new java.util.HashSet<>();
                        for (MultipartFile photo : request.getPhotos()) {
                                if (!photo.isEmpty()) {
                                        String photoPath = storageService.store(photo, "resolution-photos");
                                        photoPaths.add(photoPath);
                                }
                        }
                        shipment.setResolutionPhotoPaths(photoPaths);
                }

                shipmentRepository.save(shipment);

                if (shipment.getOrder() != null) {
                        orderActivityService.logActivity(shipment.getOrder(), ActivityType.SHIPMENT_UPDATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sorun manuel olarak çözüldü - Çözen: "
                                                        + resolver.getFirstName() + " " + resolver.getLastName());
                }

                log.info("Shipment {} problem resolved manually by user {}", request.getShipmentId(), userId);
        }

        /**
         * Auto-resolve a problematic shipment when its linked SSH order is completed
         */
        @Transactional
        public void autoResolveBySSH(UUID sshOrderId) {
                List<Shipment> shipments = shipmentRepository.findByLinkedSshOrderId(sshOrderId);

                for (Shipment shipment : shipments) {
                        if (shipment.getDeliveryStatus() == com.stokmate.domain.DeliveryStatus.PROBLEMATIC
                                        && !shipment.isProblemResolved()) {
                                shipment.setProblemResolved(true);
                                shipment.setResolutionType(ProblemResolutionType.SSH_ORDER);
                                shipment.setResolutionDescription(
                                                "SSH siparişi tamamlandığında otomatik olarak çözüldü");
                                shipment.setResolvedAt(LocalDateTime.now());
                                shipmentRepository.save(shipment);

                                if (shipment.getOrder() != null) {
                                        orderActivityService.logActivity(shipment.getOrder(),
                                                        ActivityType.SHIPMENT_UPDATED,
                                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                                        + "] Sorun SSH siparişi ile otomatik çözüldü");
                                }

                                log.info("Shipment {} auto-resolved via SSH order {}", shipment.getId(), sshOrderId);
                        }
                }
        }

        // =============== ADMIN/MANAGER SHIPMENT MANAGEMENT METHODS ===============

        /**
         * Cancel a shipment and rollback all related changes (Admin/Manager only)
         * This cascades updates to orders and sales
         */
        @Transactional
        public void cancelShipment(UUID shipmentId, UUID userId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                // Permission check
                if (!user.getRole().canModifyApprovedShipments()) {
                        throw new BadRequestException("Bu işlem için yetkiniz yok");
                }

                // Cannot cancel already finalized shipments
                if (shipment.getStatus() == ShipmentStatus.FINALIZED) {
                        throw new BadRequestException("Onaylanmış sevkiyat iptal edilemez");
                }

                // Rollback shipped quantities for each item
                for (ShipmentItem item : shipment.getItems()) {
                        if (item.getOrderProduct() != null) {
                                OrderProduct op = item.getOrderProduct();
                                BigDecimal currentShipped = op.getShippedQuantity() != null
                                                ? op.getShippedQuantity()
                                                : BigDecimal.ZERO;
                                BigDecimal newShipped = currentShipped
                                                .subtract(BigDecimal.valueOf(item.getShippedQuantity()));
                                op.setShippedQuantity(newShipped.max(BigDecimal.ZERO));
                                orderProductRepository.save(op);
                        } else if (item.getSaleProduct() != null) {
                                SaleProduct sp = item.getSaleProduct();
                                BigDecimal currentShipped = sp.getShippedQuantity() != null
                                                ? sp.getShippedQuantity()
                                                : BigDecimal.ZERO;
                                BigDecimal newShipped = currentShipped
                                                .subtract(BigDecimal.valueOf(item.getShippedQuantity()));
                                sp.setShippedQuantity(newShipped.max(BigDecimal.ZERO));
                                saleProductRepository.save(sp);
                        }
                }

                // Update order status if it was in shipment phase
                if (shipment.getOrder() != null) {
                        Order order = shipment.getOrder();
                        // Check if there are other active shipments
                        List<Shipment> otherShipments = shipmentRepository.findByOrder(order).stream()
                                        .filter(s -> !s.getId().equals(shipmentId))
                                        .filter(s -> s.getStatus() != ShipmentStatus.FINALIZED)
                                        .collect(Collectors.toList());

                        if (otherShipments.isEmpty()) {
                                // No other active shipments, revert order status
                                if (order.getStatus() == OrderStatus.SHIPMENT_APPROVED ||
                                                order.getStatus() == OrderStatus.PENDING_SHIPMENT_APPROVAL) {
                                        order.setStatus(OrderStatus.DEVAM_EDIYOR);
                                }
                        }
                        orderRepository.save(order);

                        // Log activity
                        String cancelledBy = (user.getFirstName() != null ? user.getFirstName() : "") + " "
                                        + (user.getLastName() != null ? user.getLastName() : "");
                        cancelledBy = cancelledBy.trim().isEmpty() ? user.getEmail() : cancelledBy.trim();

                        orderActivityService.logActivity(order, ActivityType.SHIPMENT_UPDATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sevkiyat iptal edildi - İptal eden: "
                                                        + cancelledBy);
                }

                // Update sale status if applicable
                if (shipment.getSale() != null) {
                        Sale sale = shipment.getSale();
                        // Check if there are other active shipments
                        List<Shipment> otherShipments = shipmentRepository.findBySale(sale).stream()
                                        .filter(s -> !s.getId().equals(shipmentId))
                                        .filter(s -> s.getStatus() != ShipmentStatus.FINALIZED)
                                        .collect(Collectors.toList());

                        if (otherShipments.isEmpty()) {
                                sale.setStatus(SaleStatus.DEVAM_EDIYOR);
                        }
                        saleRepository.save(sale);
                }

                // Delete the shipment
                shipmentRepository.delete(shipment);

                log.info("Shipment {} cancelled by user {}", shipmentId, userId);
        }

        /**
         * Update the planned shipment date (Admin/Manager only)
         * Admin/Manager can set past dates, others cannot
         */
        @Transactional
        public void updatePlannedDate(UUID shipmentId, LocalDateTime newDate, UUID userId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                // Permission check for modifying approved shipments
                if (shipment.getStatus() != ShipmentStatus.PENDING &&
                                shipment.getStatus() != ShipmentStatus.APPROVED &&
                                !user.getRole().canModifyApprovedShipments()) {
                        throw new BadRequestException("Bu sevkiyatı düzenlemek için yetkiniz yok");
                }

                // Date validation - only admin/manager can set past dates
                if (newDate != null && newDate.toLocalDate().isBefore(LocalDate.now())) {
                        if (!user.getRole().canSetPastShipmentDates()) {
                                throw new BadRequestException("Geçmiş tarih seçemezsiniz");
                        }
                }

                LocalDateTime oldDate = shipment.getPlannedShipmentDate();
                shipment.setPlannedShipmentDate(newDate);
                shipmentRepository.save(shipment);

                // Log activity
                if (shipment.getOrder() != null) {
                        String oldDateStr = oldDate != null ? oldDate.toLocalDate().toString() : "Belirsiz";
                        String newDateStr = newDate != null ? newDate.toLocalDate().toString() : "Belirsiz";
                        orderActivityService.logActivity(shipment.getOrder(), ActivityType.SHIPMENT_UPDATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sevk tarihi değiştirildi: " + oldDateStr + " -> "
                                                        + newDateStr
                                                        + " - Değiştiren: " + user.getFirstName() + " "
                                                        + user.getLastName());
                }

                log.info("Shipment {} date updated from {} to {} by user {}", shipmentId, oldDate, newDate, userId);
        }

        /**
         * Withdraw a shipment request (pull back before it's been planned)
         * Admin/Manager only
         */
        @Transactional
        public void withdrawShipment(UUID shipmentId, UUID userId) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                                .orElseThrow(() -> new NotFoundException("Shipment not found"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new NotFoundException("User not found"));

                // Permission check
                if (!user.getRole().canModifyApprovedShipments()) {
                        throw new BadRequestException("Bu işlem için yetkiniz yok");
                }

                // Can only withdraw PENDING or APPROVED shipments
                if (shipment.getStatus() != ShipmentStatus.PENDING &&
                                shipment.getStatus() != ShipmentStatus.APPROVED) {
                        throw new BadRequestException("Yalnızca bekleyen veya onaylanmış sevkiyatlar geri çekilebilir");
                }

                // Rollback shipped quantities for each item
                for (ShipmentItem item : shipment.getItems()) {
                        if (item.getOrderProduct() != null) {
                                OrderProduct op = item.getOrderProduct();
                                BigDecimal currentShipped = op.getShippedQuantity() != null
                                                ? op.getShippedQuantity()
                                                : BigDecimal.ZERO;
                                BigDecimal newShipped = currentShipped
                                                .subtract(BigDecimal.valueOf(item.getShippedQuantity()));
                                op.setShippedQuantity(newShipped.max(BigDecimal.ZERO));
                                orderProductRepository.save(op);
                        } else if (item.getSaleProduct() != null) {
                                SaleProduct sp = item.getSaleProduct();
                                BigDecimal currentShipped = sp.getShippedQuantity() != null
                                                ? sp.getShippedQuantity()
                                                : BigDecimal.ZERO;
                                BigDecimal newShipped = currentShipped
                                                .subtract(BigDecimal.valueOf(item.getShippedQuantity()));
                                sp.setShippedQuantity(newShipped.max(BigDecimal.ZERO));
                                saleProductRepository.save(sp);
                        }
                }

                // Update order status
                if (shipment.getOrder() != null) {
                        Order order = shipment.getOrder();
                        order.setStatus(OrderStatus.DEVAM_EDIYOR);
                        orderRepository.save(order);

                        // Log activity
                        String withdrawnBy = (user.getFirstName() != null ? user.getFirstName() : "") + " "
                                        + (user.getLastName() != null ? user.getLastName() : "");
                        withdrawnBy = withdrawnBy.trim().isEmpty() ? user.getEmail() : withdrawnBy.trim();

                        orderActivityService.logActivity(order, ActivityType.SHIPMENT_UPDATED,
                                        "[Sevk #" + shipment.getId().toString().substring(0, 8)
                                                        + "] Sevk talebi geri çekildi - "
                                                        + withdrawnBy);
                }

                // Update sale status
                if (shipment.getSale() != null) {
                        Sale sale = shipment.getSale();
                        sale.setStatus(SaleStatus.DEVAM_EDIYOR);
                        saleRepository.save(sale);
                }

                // Delete the shipment
                shipmentRepository.delete(shipment);

                log.info("Shipment {} withdrawn by user {}", shipmentId, userId);
        }

        private String formatCustomerAddress(Customer c) {
                if (c == null)
                        return "";
                StringBuilder sb = new StringBuilder();
                if (c.getFullAddress() != null && !c.getFullAddress().isEmpty()) {
                        sb.append(c.getFullAddress());
                }
                if (c.getNeighborhood() != null && !c.getNeighborhood().isEmpty()) {
                        if (sb.length() > 0)
                                sb.append(" ");
                        sb.append(c.getNeighborhood());
                }
                if (c.getDistrict() != null && !c.getDistrict().isEmpty()) {
                        if (sb.length() > 0)
                                sb.append(" ");
                        sb.append(c.getDistrict());
                }
                if (c.getCity() != null && !c.getCity().isEmpty()) {
                        if (sb.length() > 0)
                                sb.append(" / ");
                        sb.append(c.getCity());
                }
                return sb.toString();
        }
}
