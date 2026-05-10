package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.orderreceipt.*;
import com.stokmate.exception.BadRequestException;
import com.stokmate.mapper.OrderReceiptMapper;
import com.stokmate.mapper.OrderReceiptPhotoMapper;
import com.stokmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderReceiptService {

        private final OrderReceiptRepository orderReceiptRepository;
        private final OrderReceiptPhotoRepository orderReceiptPhotoRepository;
        private final OrderProductRepository orderProductRepository;
        private final OrderRepository orderRepository;
        private final OrderActivityService orderActivityService;
        private final StorageService storageService;
        private final OrderReceiptMapper orderReceiptMapper;
        private final OrderReceiptPhotoMapper orderReceiptPhotoMapper;
        private final ProductRepository productRepository;
        private final ProductArrivalRepository productArrivalRepository;
        private final com.stokmate.repository.ProductEventRepository productEventRepository;
        private final com.stokmate.repository.ProductPriceHistoryRepository productPriceHistoryRepository;
        private final ShipmentService shipmentService;
        private final ShipmentRepository shipmentRepository;

        @Transactional
        public OrderReceiptResponse createReceipt(
                        OrderReceiptCreateRequest request,
                        List<MultipartFile> photos,
                        User currentUser) {

                // 1. Validate order product exists
                OrderProduct orderProduct = orderProductRepository.findById(request.getOrderProductId())
                                .orElseThrow(() -> new BadRequestException("Order product not found"));

                // 2. Validate received quantity doesn't exceed remaining quantity
                // Note: We use OrderReceipt logic for validation, not
                // OrderProduct.remainingQuantity directly
                // to avoid race conditions with other pending receipts?
                // Actually, validation logic in original code calculated totalReceived from
                // receipts.
                // We should use OrderProduct's acceptedQuantity + PENDING receipts?
                // Let's stick to original logic but fix types first.

                BigDecimal totalReceived = orderReceiptRepository.findByOrderProduct_Id(request.getOrderProductId())
                                .stream()
                                .filter(r -> r.getStatus() != OrderReceiptStatus.REJECTED)
                                .map(OrderReceipt::getReceivedQuantity)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal remaining = orderProduct.getQuantity().subtract(totalReceived);

                BigDecimal accepted = orderProduct.getAcceptedQuantity();
                BigDecimal pending = totalReceived.subtract(accepted);

                if (request.getReceivedQuantity().compareTo(remaining) > 0) {
                        throw new BadRequestException(
                                        String.format(
                                                        "Cannot receive %s units. Remaining: %s (Ordered: %s, Accepted: %s, Pending: %s)",
                                                        request.getReceivedQuantity(), remaining,
                                                        orderProduct.getQuantity(), accepted, pending));
                }

                // 3. Create receipt
                OrderReceipt receipt = OrderReceipt.builder()
                                .orderProduct(orderProduct)
                                .receivedQuantity(request.getReceivedQuantity())
                                .notes(request.getNotes())
                                .vehiclePlate(request.getVehiclePlate())
                                .driverName(request.getDriverName())
                                .driverPhone(request.getDriverPhone())
                                .receivedBy(currentUser)
                                .build();

                // 4. Set status based on user role
                boolean isApproved = false;
                if (currentUser.getRole() == Role.OPERATIONS_MANAGER) {
                        receipt.setStatus(OrderReceiptStatus.PENDING_APPROVAL);
                        log.info("Receipt created by OPERATIONS_MANAGER, status: PENDING_APPROVAL");
                } else {
                        receipt.setStatus(OrderReceiptStatus.APPROVED);
                        receipt.setApprovedBy(currentUser);
                        receipt.setApprovedAt(Instant.now());
                        isApproved = true;
                        log.info("Receipt created by {}, auto-approved", currentUser.getRole());
                }

                // 5. Save receipt
                receipt = orderReceiptRepository.save(receipt);

                // 6. Upload photos to MinIO
                if (photos != null && !photos.isEmpty()) {
                        for (MultipartFile photo : photos) {
                                if (!photo.isEmpty()) {
                                        uploadPhoto(receipt, photo);
                                }
                        }
                }

                // 7. Handle approval side effects
                if (isApproved) {
                        handleReceiptApproval(receipt, currentUser);
                }

                return toResponseWithPhotos(receipt);
        }

        @Transactional
        public OrderReceiptResponse approveReceipt(UUID receiptId, OrderReceiptApprovalRequest request, User approver) {
                OrderReceipt receipt = orderReceiptRepository.findById(receiptId)
                                .orElseThrow(() -> new BadRequestException("Receipt not found"));

                if (receipt.getStatus() != OrderReceiptStatus.PENDING_APPROVAL) {
                        throw new BadRequestException("Receipt is not pending approval");
                }

                receipt.setStatus(OrderReceiptStatus.APPROVED);
                receipt.setApprovedBy(approver);
                receipt.setApprovedAt(Instant.now());
                receipt.setApprovalNotes(request.getApprovalNotes());

                receipt = orderReceiptRepository.save(receipt);
                log.info("Receipt {} approved by user {}", receiptId, approver.getEmail());

                handleReceiptApproval(receipt, approver);

                return toResponseWithPhotos(receipt);
        }

        @Transactional
        public OrderReceiptResponse rejectReceipt(UUID receiptId, OrderReceiptApprovalRequest request, User approver) {
                OrderReceipt receipt = orderReceiptRepository.findById(receiptId)
                                .orElseThrow(() -> new BadRequestException("Receipt not found"));

                if (receipt.getStatus() != OrderReceiptStatus.PENDING_APPROVAL) {
                        throw new BadRequestException("Receipt is not pending approval");
                }

                receipt.setStatus(OrderReceiptStatus.REJECTED);
                receipt.setApprovedBy(approver);
                receipt.setApprovedAt(Instant.now());
                receipt.setApprovalNotes(request.getApprovalNotes());

                receipt = orderReceiptRepository.save(receipt);
                log.info("Receipt {} rejected by user {}", receiptId, approver.getEmail());

                // Log rejection
                orderActivityService.logActivity(receipt.getOrderProduct().getOrder(),
                                ActivityType.ORDER_UPDATED,
                                String.format("Ürün kabulü reddedildi: %s - %s miktar",
                                                receipt.getOrderProduct().getProductName(),
                                                receipt.getReceivedQuantity()));

                return toResponseWithPhotos(receipt);
        }

        // ... existing listReceipts, getReceiptById, etc methods ...
        @Transactional(readOnly = true)
        public List<OrderReceiptResponse> listReceipts(UUID orderId, OrderReceiptStatus status) {
                List<OrderReceipt> receipts;

                if (orderId != null && status != null) {
                        receipts = orderReceiptRepository.findByOrderProduct_Order_Id(orderId)
                                        .stream()
                                        .filter(r -> r.getStatus() == status)
                                        .collect(Collectors.toList());
                } else if (orderId != null) {
                        receipts = orderReceiptRepository.findByOrderProduct_Order_Id(orderId);
                } else if (status != null) {
                        receipts = orderReceiptRepository.findByStatus(status);
                } else {
                        receipts = orderReceiptRepository.findAll();
                }

                return receipts.stream()
                                .map(this::toResponseWithPhotos)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public org.springframework.data.domain.Page<OrderReceiptResponse> listAllPaged(
                        String search,
                        OrderReceiptStatus status,
                        UUID receivedBy,
                        UUID approvedBy,
                        org.springframework.data.domain.Pageable pageable) {

                org.springframework.data.domain.Page<OrderReceipt> page = orderReceiptRepository.findAllPaged(
                                search, status, receivedBy, approvedBy, pageable);

                return page.map(this::toResponseWithPhotos);
        }

        @Transactional(readOnly = true)
        public OrderReceiptResponse getReceiptById(UUID id) {
                OrderReceipt receipt = orderReceiptRepository.findById(id)
                                .orElseThrow(() -> new BadRequestException("Receipt not found"));
                return toResponseWithPhotos(receipt);
        }

        @Transactional(readOnly = true)
        public List<OrderReceiptResponse> getReceiptsForOrder(UUID orderId) {
                List<OrderReceipt> receipts = orderReceiptRepository.findByOrderProduct_Order_Id(orderId);
                return receipts.stream()
                                .map(this::toResponseWithPhotos)
                                .collect(Collectors.toList());
        }

        private void handleReceiptApproval(OrderReceipt receipt, User approver) {
                OrderProduct orderProduct = receipt.getOrderProduct();
                Order order = orderProduct.getOrder();

                // 1. Update OrderProduct accepted quantity
                BigDecimal newAcceptedQty = orderProduct.getAcceptedQuantity().add(receipt.getReceivedQuantity());
                orderProduct.setAcceptedQuantity(newAcceptedQty);
                orderProductRepository.save(orderProduct);

                log.info("Updated OrderProduct {} accepted quantity to {}", orderProduct.getId(), newAcceptedQty);

                // 2. Log activity
                orderActivityService.logActivity(order, ActivityType.PRODUCTS_ACCEPTED,
                                String.format("Ürün kabul edildi: %s - %s miktar (%s tarafından)",
                                                orderProduct.getProductName(), receipt.getReceivedQuantity(),
                                                approver.getFirstName()));

                // 3. Check and update Order status
                boolean allProductsFullyAccepted = order.getProducts().stream()
                                .allMatch(OrderProduct::isFullyAccepted);

                boolean anyProductAccepted = order.getProducts().stream()
                                .anyMatch(op -> op.getAcceptedQuantity().compareTo(BigDecimal.ZERO) > 0);

                // 3. Update Product stock and history for STOCK orders (On every approved
                // receipt!)
                if (order.getOrderType() == com.stokmate.domain.OrderType.STOCK) {
                        handleStockUpdateForApprovedReceipt(receipt);
                }

                // 4. Check and update Order status (Full acceptability check)
                if (allProductsFullyAccepted) {
                        if (order.getOrderType() == com.stokmate.domain.OrderType.STOCK) {
                                order.setStatus(OrderStatus.TAMAMLANDI);
                                order.setProductsAccepted(true);
                                orderRepository.save(order);
                                orderActivityService.logActivity(order, ActivityType.ORDER_UPDATED,
                                                "Tüm ürünler kabul edildi, STOK siparişi tamamlandı");
                                log.info("STOCK Order {} marked as TAMAMLANDI", order.getOrderNo());
                        } else {
                                // CUSTOMER_SPECIFIC siparişler sevk onayına gider
                                order.setStatus(OrderStatus.PENDING_SHIPMENT_APPROVAL);
                                order.setProductsAccepted(true);
                                orderRepository.save(order);
                                orderActivityService.logActivity(order, ActivityType.ORDER_UPDATED,
                                                "Tüm ürünler kabul edildi, sevk onayı bekleniyor");
                                log.info("Order {} marked as PENDING_SHIPMENT_APPROVAL", order.getOrderNo());

                                // AUTO-SHIPMENT LOGIC
                                try {
                                        // Get pending shipments to avoid double shipping
                                        List<Shipment> activeShipments = shipmentRepository.findByOrder(order).stream()
                                                        .filter(s -> s.getStatus() != ShipmentStatus.FINALIZED)
                                                        .collect(Collectors.toList());

                                        List<com.stokmate.dto.shipment.ProductShipmentRequest> itemsToShip = java.util.Collections
                                                        .emptyList();

                                        // Calculate items to ship
                                        itemsToShip = order.getProducts().stream()
                                                        .map(op -> {
                                                                BigDecimal pendingQty = activeShipments.stream()
                                                                                .flatMap(s -> s.getItems().stream())
                                                                                .filter(item -> item
                                                                                                .getOrderProduct() != null
                                                                                                && item.getOrderProduct()
                                                                                                                .getId()
                                                                                                                .equals(op.getId()))
                                                                                .map(item -> BigDecimal.valueOf(item
                                                                                                .getShippedQuantity()))
                                                                                .reduce(BigDecimal.ZERO,
                                                                                                BigDecimal::add);

                                                                BigDecimal availableQty = op.getAcceptedQuantity()
                                                                                .subtract(op.getShippedQuantity() != null
                                                                                                ? op.getShippedQuantity()
                                                                                                : BigDecimal.ZERO)
                                                                                .subtract(pendingQty);
                                                                return java.util.Map.entry(op, availableQty);
                                                        })
                                                        .filter(entry -> entry.getValue()
                                                                        .compareTo(BigDecimal.ZERO) > 0)
                                                        .map(entry -> com.stokmate.dto.shipment.ProductShipmentRequest
                                                                        .builder()
                                                                        .orderProductId(entry.getKey().getId())
                                                                        .quantityToShip(entry.getValue())
                                                                        .build())
                                                        .collect(Collectors.toList());

                                        if (!itemsToShip.isEmpty()) {
                                                log.info("Auto-creating shipment for order {} with {} items",
                                                                order.getOrderNo(),
                                                                itemsToShip.size());
                                                com.stokmate.dto.shipment.PartialShipmentRequest shipmentRequest = com.stokmate.dto.shipment.PartialShipmentRequest
                                                                .builder()
                                                                .orderId(order.getId())
                                                                .productShipments(itemsToShip)
                                                                .notes(String.format(
                                                                                "Otomatik oluşturulan sevkiyat (Tüm ürünler kabul edildi) - %s",
                                                                                java.time.LocalDateTime.now()
                                                                                                .format(java.time.format.DateTimeFormatter
                                                                                                                .ofPattern("dd.MM.yyyy HH:mm"))))
                                                                .build();

                                                shipmentService.createPartialShipment(shipmentRequest,
                                                                approver.getId());
                                                log.info("Successfully auto-created shipment for order {}",
                                                                order.getOrderNo());
                                        }
                                } catch (Exception e) {
                                        log.error("Failed to auto-create shipment for order {}", order.getOrderNo(), e);
                                }
                        }

                } else if (anyProductAccepted && order.getStatus() != OrderStatus.PARTIALLY_ACCEPTED) {
                        order.setStatus(OrderStatus.PARTIALLY_ACCEPTED);
                        order.setProductsAccepted(true); // Flag to show "some products accepted"
                        orderRepository.save(order);
                        orderActivityService.logActivity(order, ActivityType.ORDER_UPDATED,
                                        "Sipariş kısmen kabul edildi");
                }
        }

        private void uploadPhoto(OrderReceipt receipt, MultipartFile file) {
                try {
                        String originalFilename = file.getOriginalFilename();
                        String fileKey = String.format("receipts/%s/%s_%s",
                                        receipt.getId(),
                                        System.currentTimeMillis(),
                                        originalFilename);

                        // Upload to MinIO
                        storageService.upload(fileKey, file.getBytes(), file.getContentType());

                        // Create photo record
                        OrderReceiptPhoto photo = OrderReceiptPhoto.builder()
                                        .orderReceipt(receipt)
                                        .fileKey(fileKey)
                                        .fileName(originalFilename)
                                        .fileSize(file.getSize())
                                        .build();

                        orderReceiptPhotoRepository.save(photo);
                        receipt.addPhoto(photo);

                        log.info("Uploaded photo {} for receipt {}", fileKey, receipt.getId());
                } catch (IOException e) {
                        log.error("Failed to upload photo", e);
                        throw new BadRequestException("Failed to upload photo: " + e.getMessage());
                }
        }

        private OrderReceiptResponse toResponseWithPhotos(OrderReceipt receipt) {
                OrderReceiptResponse response = orderReceiptMapper.toResponse(receipt);

                // Get photos and add presigned URLs
                List<OrderReceiptPhoto> photos = orderReceiptPhotoRepository.findByOrderReceipt(receipt);
                List<OrderReceiptPhotoResponse> photoResponses = photos.stream()
                                .map(photo -> {
                                        OrderReceiptPhotoResponse photoResponse = orderReceiptPhotoMapper
                                                        .toResponse(photo);
                                        // Return raw path for backend proxy (frontend uses /api/files/view)
                                        photoResponse.setDownloadUrl(photo.getFileKey());
                                        return photoResponse;
                                })
                                .collect(Collectors.toList());

                response.setPhotos(photoResponses);

                // Populate productId for STOCK orders (enables product enrichment flow in
                // frontend)
                if (receipt.getOrderProduct() != null && receipt.getOrderProduct().getProductCode() != null) {
                        productRepository.findByCode(receipt.getOrderProduct().getProductCode())
                                        .ifPresent(product -> response.setProductId(product.getId()));
                }

                return response;
        }

        /**
         * Update stock and historical arrival records for a specific approved receipt
         */
        private void handleStockUpdateForApprovedReceipt(OrderReceipt receipt) {
                OrderProduct orderProduct = receipt.getOrderProduct();
                Order order = orderProduct.getOrder();

                // Find product by code
                Product product = productRepository.findByCode(orderProduct.getProductCode())
                                .orElse(null);

                if (product != null) {
                        // Product exists - update stock and create arrival record
                        ProductArrival arrival = ProductArrival.builder()
                                        .productId(product.getId())
                                        .orderId(order.getId())
                                        .quantity(receipt.getReceivedQuantity())
                                        .arrivalPrice(orderProduct.getNetPrice() != null ? orderProduct.getNetPrice()
                                                        : (orderProduct.getGrossPrice() != null
                                                                        ? orderProduct.getGrossPrice()
                                                                        : BigDecimal.ZERO))
                                        .vatRate(orderProduct.getVat() != null ? orderProduct.getVat()
                                                        : BigDecimal.ZERO)
                                        .receivedBy(order.getCreatedBy() != null ? order.getCreatedBy().toString()
                                                        : "system")
                                        .build();

                        productArrivalRepository.save(arrival);

                        // Update product's current arrival price and stock
                        product.setArrivalPrice(arrival.getArrivalPrice());
                        product.setVatRate(arrival.getVatRate());

                        // Check if this is a converted order (iptal stoğu)
                        boolean isCancelledStock = order.isConvertedFromCustomer();

                        if (isCancelledStock) {
                                // İptal stoğu - add to cancelledStockQuantity
                                BigDecimal newCancelledQty = product.getCancelledStockQuantity()
                                                .add(receipt.getReceivedQuantity());
                                product.setCancelledStockQuantity(newCancelledQty);
                                log.info("Updated product {} cancelled stock by {} via receipt. New cancelled stock: {}",
                                                product.getCode(), receipt.getReceivedQuantity(), newCancelledQty);
                        } else {
                                // Normal stok - add to stockQuantity
                                product.setStockQuantity(product.getStockQuantity().add(receipt.getReceivedQuantity()));
                                log.info("Updated existing product {} stock by {} via receipt. New stock: {}",
                                                product.getCode(), receipt.getReceivedQuantity(),
                                                product.getStockQuantity());
                        }

                        // Update brand if missing
                        if (product.getBrand() == null && orderProduct.getBrand() != null) {
                                product.setBrand(orderProduct.getBrand());
                        }

                        productRepository.save(product);

                        // Create ProductEvent for stock increase
                        com.stokmate.domain.ProductEvent productEvent = new com.stokmate.domain.ProductEvent();
                        productEvent.setProduct(product);

                        if (isCancelledStock) {
                                productEvent.setEventType("CANCELLED_STOCK_ACCEPTANCE");
                                productEvent.setQuantityChange(receipt.getReceivedQuantity());
                                productEvent.setDescription(
                                                String.format("İptal Stoğu Kabulü - Sipariş: %s (Müşteriden iptal edilen)",
                                                                order.getOrderNo()));
                        } else {
                                productEvent.setEventType("STOCK_ACCEPTANCE");
                                productEvent.setQuantityChange(receipt.getReceivedQuantity());
                                productEvent.setDescription(
                                                String.format("Ürün kabul edildi - Sipariş: %s", order.getOrderNo()));
                        }

                        productEvent.setCreatedBy(receipt.getReceivedBy());
                        productEvent.setCreatedAt(java.time.LocalDateTime.now());
                        productEventRepository.save(productEvent);
                        log.info("Created ProductEvent for product {}", product.getCode());

                        // Create ProductPriceHistory if pricing info exists
                        if (orderProduct.getGrossPrice() != null) {
                                com.stokmate.domain.ProductPriceHistory priceHistory = new com.stokmate.domain.ProductPriceHistory();
                                priceHistory.setProduct(product);
                                priceHistory.setGrossPrice(orderProduct.getGrossPrice());
                                priceHistory.setNetPrice(
                                                orderProduct.getNetPrice() != null ? orderProduct.getNetPrice()
                                                                : orderProduct.getGrossPrice());
                                priceHistory.setFixedDiscount(
                                                orderProduct.getFixedDiscount() != null
                                                                ? orderProduct.getFixedDiscount()
                                                                : BigDecimal.ZERO);
                                priceHistory.setCashDiscount(
                                                orderProduct.getCashDiscount() != null ? orderProduct.getCashDiscount()
                                                                : BigDecimal.ZERO);
                                priceHistory.setDisplayDiscount(
                                                orderProduct.getDisplayDiscount() != null
                                                                ? orderProduct.getDisplayDiscount()
                                                                : BigDecimal.ZERO);
                                priceHistory.setDiscount1(
                                                orderProduct.getDiscount1() != null ? orderProduct.getDiscount1()
                                                                : BigDecimal.ZERO);
                                priceHistory.setDiscount2(
                                                orderProduct.getDiscount2() != null ? orderProduct.getDiscount2()
                                                                : BigDecimal.ZERO);
                                priceHistory.setDiscount3(
                                                orderProduct.getDiscount3() != null ? orderProduct.getDiscount3()
                                                                : BigDecimal.ZERO);
                                priceHistory.setDiscount4(
                                                orderProduct.getDiscount4() != null ? orderProduct.getDiscount4()
                                                                : BigDecimal.ZERO);
                                priceHistory.setDiscount5(
                                                orderProduct.getDiscount5() != null ? orderProduct.getDiscount5()
                                                                : BigDecimal.ZERO);
                                priceHistory.setVat(orderProduct.getVat() != null ? orderProduct.getVat()
                                                : BigDecimal.ZERO);
                                priceHistory.setPaymentCondition(orderProduct.getPaymentCondition());
                                priceHistory.setPaymentConditionDefinition(
                                                orderProduct.getPaymentConditionDefinition());
                                priceHistory.setQuantity(receipt.getReceivedQuantity());
                                priceHistory.setRemainingQuantity(receipt.getReceivedQuantity());
                                priceHistory.setRelatedOrder(order);
                                priceHistory.setCreatedBy(receipt.getReceivedBy());
                                priceHistory.setCreatedAt(java.time.LocalDateTime.now());
                                productPriceHistoryRepository.save(priceHistory);
                                log.info("Created ProductPriceHistory for product {}", product.getCode());
                        }
                } else {
                        // Product doesn't exist - create new product for STOCK orders
                        Product newProduct = new Product();
                        newProduct.setCode(orderProduct.getProductCode());
                        newProduct.setName(orderProduct.getProductName());
                        newProduct.setBrand(orderProduct.getBrand());
                        newProduct.setStockQuantity(receipt.getReceivedQuantity());

                        // Fix null arrival price issue
                        BigDecimal arrivalPrice = orderProduct.getNetPrice() != null ? orderProduct.getNetPrice()
                                        : (orderProduct.getGrossPrice() != null ? orderProduct.getGrossPrice()
                                                        : BigDecimal.ZERO);

                        newProduct.setArrivalPrice(arrivalPrice);
                        newProduct.setVatRate(orderProduct.getVat() != null ? orderProduct.getVat() : BigDecimal.ZERO);
                        newProduct.setActiveForSale(true);

                        Product savedProduct = productRepository.save(newProduct);

                        // Create ProductArrival record
                        ProductArrival arrival = ProductArrival.builder()
                                        .productId(savedProduct.getId())
                                        .orderId(order.getId())
                                        .quantity(receipt.getReceivedQuantity())
                                        .arrivalPrice(savedProduct.getArrivalPrice())
                                        .vatRate(savedProduct.getVatRate())
                                        .receivedBy(order.getCreatedBy() != null ? order.getCreatedBy().toString()
                                                        : "system")
                                        .build();

                        productArrivalRepository.save(arrival);

                        log.info("Created new product {} with quantity {} at price {}",
                                        savedProduct.getCode(), receipt.getReceivedQuantity(),
                                        arrival.getArrivalPrice());
                }
        }
}
