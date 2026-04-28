package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.acceptance.PendingProductResponse;
import com.stokmate.dto.acceptance.ProductAcceptanceRequest;
import com.stokmate.dto.acceptance.ProductAcceptanceResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.ProductAcceptanceMapper;
import com.stokmate.repository.OrderProductRepository;
import com.stokmate.repository.OrderRepository;
import com.stokmate.repository.ProductAcceptanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.stokmate.dto.shipment.PartialShipmentRequest;
import com.stokmate.dto.shipment.ProductShipmentRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductAcceptanceService {

    private final ProductAcceptanceRepository productAcceptanceRepository;
    private final OrderProductRepository orderProductRepository;
    private final OrderRepository orderRepository;
    private final ProductAcceptanceMapper productAcceptanceMapper;
    private final StorageService storageService;
    private final com.stokmate.repository.ProductEventRepository productEventRepository;
    private final com.stokmate.repository.ProductPriceHistoryRepository productPriceHistoryRepository;
    private final com.stokmate.repository.ProductRepository productRepository;
    private final ShipmentService shipmentService;
    private final com.stokmate.repository.ShipmentRepository shipmentRepository;

    @Transactional
    public ProductAcceptanceResponse acceptProduct(
            ProductAcceptanceRequest request,
            MultipartFile[] images,
            User user) {

        // Validate images
        if (images == null || images.length == 0) {
            throw new BadRequestException("At least one image is required");
        }

        // Get OrderProduct
        OrderProduct orderProduct = orderProductRepository.findById(UUID.fromString(request.getOrderProductId()))
                .orElseThrow(() -> new NotFoundException("Order product not found"));

        // Validate quantity
        BigDecimal remainingQuantity = orderProduct.getRemainingQuantity();
        if (request.getAcceptedQuantity().compareTo(remainingQuantity) > 0) {
            throw new BadRequestException(
                    String.format("Cannot accept %s items. Only %s remaining",
                            request.getAcceptedQuantity(), remainingQuantity));
        }

        // Upload images
        List<String> imagePaths = new ArrayList<>();
        for (MultipartFile image : images) {
            try {
                String path = storageService.store(image, "acceptance-images");
                imagePaths.add(path);
            } catch (Exception e) {
                log.error("Failed to upload image", e);
                throw new BadRequestException("Failed to upload image: " + e.getMessage());
            }
        }

        // Create ProductAcceptance
        ProductAcceptance acceptance = new ProductAcceptance();
        acceptance.setOrderProduct(orderProduct);
        acceptance.setAcceptedQuantity(request.getAcceptedQuantity());
        acceptance.setNote(request.getNote());
        acceptance.setVehiclePlate(request.getVehiclePlate());
        acceptance.setDriverInfo(request.getDriverInfo());
        acceptance.setImagePaths(imagePaths);
        acceptance.setAcceptedBy(user);
        acceptance.setAcceptanceDate(LocalDateTime.now());
        acceptance.setStatus(ProductAcceptance.AcceptanceStatus.PENDING);

        ProductAcceptance saved = productAcceptanceRepository.save(acceptance);

        // Update OrderProduct acceptedQuantity
        orderProduct.setAcceptedQuantity(
                orderProduct.getAcceptedQuantity().add(request.getAcceptedQuantity()));
        orderProductRepository.save(orderProduct);
        orderProductRepository.flush(); // Ensure visibility

        // For STOCK orders, create ProductEvent and ProductPriceHistory
        Order order = orderProduct.getOrder();
        if (order.getOrderType() == OrderType.STOCK) {
            // Find product by productCode
            Product product = productRepository.findByCode(orderProduct.getProductCode()).orElse(null);

            if (product != null) {
                // Update brand from order if product doesn't have one or if order specifies a
                // brand
                Brand orderBrand = orderProduct.getBrand();
                if (orderBrand != null && (product.getBrand() == null || product.getBrand() != orderBrand)) {
                    log.info("Updating product {} brand from {} to {}",
                            product.getCode(), product.getBrand(), orderBrand);
                    product.setBrand(orderBrand);
                    productRepository.save(product);
                }

                // Check if this is a converted order (iptal stoğu)
                boolean isCancelledStock = order.isConvertedFromCustomer();

                // Create ProductEvent for stock increase
                com.stokmate.domain.ProductEvent productEvent = new com.stokmate.domain.ProductEvent();
                productEvent.setProduct(product);

                if (isCancelledStock) {
                    // İptal stoğu - add to cancelledStockQuantity
                    BigDecimal oldCancelledQty = product.getCancelledStockQuantity();
                    BigDecimal newCancelledQty = oldCancelledQty.add(request.getAcceptedQuantity());
                    product.setCancelledStockQuantity(newCancelledQty);
                    productRepository.save(product);

                    productEvent.setEventType("CANCELLED_STOCK_ACCEPTANCE");
                    productEvent.setQuantityChange(request.getAcceptedQuantity());
                    productEvent.setDescription(String
                            .format("İptal Stoğu Kabulü - Sipariş: %s (Müşteriden iptal edilen)", order.getOrderNo()));
                } else {
                    // Normal stok
                    productEvent.setEventType("STOCK_ACCEPTANCE");
                    productEvent.setQuantityChange(request.getAcceptedQuantity());
                    productEvent.setDescription(String.format("Ürün kabul edildi - Sipariş: %s", order.getOrderNo()));
                }

                productEvent.setCreatedBy(user);
                productEvent.setCreatedAt(LocalDateTime.now());
                productEventRepository.save(productEvent);

                // Create ProductPriceHistory if pricing info exists
                if (orderProduct.getGrossPrice() != null) {
                    com.stokmate.domain.ProductPriceHistory priceHistory = new com.stokmate.domain.ProductPriceHistory();
                    priceHistory.setProduct(product);
                    priceHistory.setGrossPrice(orderProduct.getGrossPrice());
                    priceHistory.setNetPrice(
                            orderProduct.getNetPrice() != null ? orderProduct.getNetPrice()
                                    : orderProduct.getGrossPrice());
                    priceHistory.setFixedDiscount(
                            orderProduct.getFixedDiscount() != null ? orderProduct.getFixedDiscount()
                                    : BigDecimal.ZERO);
                    priceHistory.setCashDiscount(
                            orderProduct.getCashDiscount() != null ? orderProduct.getCashDiscount() : BigDecimal.ZERO);
                    priceHistory.setDisplayDiscount(
                            orderProduct.getDisplayDiscount() != null ? orderProduct.getDisplayDiscount()
                                    : BigDecimal.ZERO);
                    priceHistory.setDiscount1(
                            orderProduct.getDiscount1() != null ? orderProduct.getDiscount1() : BigDecimal.ZERO);
                    priceHistory.setDiscount2(
                            orderProduct.getDiscount2() != null ? orderProduct.getDiscount2() : BigDecimal.ZERO);
                    priceHistory.setDiscount3(
                            orderProduct.getDiscount3() != null ? orderProduct.getDiscount3() : BigDecimal.ZERO);
                    priceHistory.setDiscount4(
                            orderProduct.getDiscount4() != null ? orderProduct.getDiscount4() : BigDecimal.ZERO);
                    priceHistory.setDiscount5(
                            orderProduct.getDiscount5() != null ? orderProduct.getDiscount5() : BigDecimal.ZERO);
                    priceHistory.setVat(orderProduct.getVat() != null ? orderProduct.getVat() : BigDecimal.ZERO);
                    priceHistory.setPaymentCondition(orderProduct.getPaymentCondition());
                    priceHistory.setPaymentConditionDefinition(orderProduct.getPaymentConditionDefinition());
                    priceHistory.setQuantity(request.getAcceptedQuantity());
                    priceHistory.setRemainingQuantity(request.getAcceptedQuantity());
                    priceHistory.setRelatedOrder(order);
                    priceHistory.setCreatedBy(user);
                    priceHistory.setCreatedAt(LocalDateTime.now());
                    productPriceHistoryRepository.save(priceHistory);
                }
            }
        }

        // Check if order should be auto-completed
        checkAndCompleteOrder(orderProduct.getOrder(), user);

        return productAcceptanceMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PendingProductResponse> getPendingProducts() {
        // Get orders that need product acceptance
        // PENDING_ACCEPTANCE: Standard orders waiting for acceptance
        // Also include IN_PROGRESS orders that may have remaining products (includes
        // SSH orders)
        List<Order> pendingAcceptanceOrders = orderRepository.findByStatus(OrderStatus.PENDING_ACCEPTANCE);
        List<Order> inProgressOrders = orderRepository.findByStatus(OrderStatus.IN_PROGRESS);
        // Include cancelled STOCK orders (converted from customer orders) that still
        // have unaccepted products
        List<Order> cancelledStockOrders = orderRepository.findByStatus(OrderStatus.IPTAL_EDILDI);

        List<PendingProductResponse> pendingProducts = new ArrayList<>();

        // Process PENDING_ACCEPTANCE orders
        for (Order order : pendingAcceptanceOrders) {
            for (OrderProduct op : order.getProducts()) {
                if (op.getRemainingQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    PendingProductResponse response = PendingProductResponse.builder()
                            .orderProductId(op.getId().toString())
                            .orderId(order.getId().toString())
                            .orderNumber(order.getOrderNo())
                            .productName(op.getProductName())
                            .productCode(op.getProductCode())
                            .totalQuantity(op.getQuantity())
                            .acceptedQuantity(op.getAcceptedQuantity())
                            .remainingQuantity(op.getRemainingQuantity())
                            .orderDate(order.getOrderDate())
                            .convertedFromCustomer(order.isConvertedFromCustomer())
                            .build();
                    pendingProducts.add(response);
                }
            }
        }

        // Process IN_PROGRESS orders (includes SSH orders)
        for (Order order : inProgressOrders) {
            for (OrderProduct op : order.getProducts()) {
                if (op.getRemainingQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    PendingProductResponse response = PendingProductResponse.builder()
                            .orderProductId(op.getId().toString())
                            .orderId(order.getId().toString())
                            .orderNumber(order.getOrderNo())
                            .productName(op.getProductName())
                            .productCode(op.getProductCode())
                            .totalQuantity(op.getQuantity())
                            .acceptedQuantity(op.getAcceptedQuantity())
                            .remainingQuantity(op.getRemainingQuantity())
                            .orderDate(order.getOrderDate())
                            .convertedFromCustomer(order.isConvertedFromCustomer())
                            .build();
                    pendingProducts.add(response);
                }
            }
        }

        // Process cancelled STOCK orders (converted from customer orders)
        for (Order order : cancelledStockOrders) {
            // Only include STOCK type orders (these are converted customer orders)
            if (order.getOrderType() != OrderType.STOCK) {
                continue;
            }
            for (OrderProduct op : order.getProducts()) {
                if (op.getRemainingQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    PendingProductResponse response = PendingProductResponse.builder()
                            .orderProductId(op.getId().toString())
                            .orderId(order.getId().toString())
                            .orderNumber(order.getOrderNo())
                            .productName(op.getProductName())
                            .productCode(op.getProductCode())
                            .totalQuantity(op.getQuantity())
                            .acceptedQuantity(op.getAcceptedQuantity())
                            .remainingQuantity(op.getRemainingQuantity())
                            .orderDate(order.getOrderDate())
                            .convertedFromCustomer(true)
                            .build();
                    pendingProducts.add(response);
                }
            }
        }

        // Sort by orderDate ascending (oldest first)
        pendingProducts.sort((a, b) -> {
            if (a.getOrderDate() == null && b.getOrderDate() == null)
                return 0;
            if (a.getOrderDate() == null)
                return 1;
            if (b.getOrderDate() == null)
                return -1;
            return a.getOrderDate().compareTo(b.getOrderDate());
        });

        return pendingProducts;
    }

    @Transactional(readOnly = true)
    public List<ProductAcceptanceResponse> getOrderAcceptances(String orderId) {
        List<ProductAcceptance> acceptances = productAcceptanceRepository
                .findByOrderIdOrderByAcceptanceDateDesc(orderId);

        return acceptances.stream()
                .map(productAcceptanceMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ProductAcceptanceResponse> getAllPaged(
            String search,
            ProductAcceptance.AcceptanceStatus status,
            String brand,
            String acceptedBy,
            org.springframework.data.domain.Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;

        // Convert "ALL" defaults to null for the query
        ProductAcceptance.AcceptanceStatus parsedStatus = status;
        String parsedBrand = ("ALL".equals(brand)) ? null : brand;

        // Handle "MARKASIZ" brand case -> we treat it as empty string or null in DB,
        // but for now let's just use the parameter as is. If we want we could map it.
        if ("MARKASIZ".equals(parsedBrand)) {
            parsedBrand = "";
        }

        String parsedAcceptedBy = ("ALL".equals(acceptedBy)) ? null : acceptedBy;

        return productAcceptanceRepository.findAllPaged(
                searchParam, parsedStatus, parsedBrand, parsedAcceptedBy, pageable)
                .map(productAcceptanceMapper::toResponse);
    }

    private void checkAndCompleteOrder(Order orderArg, User user) {
        log.info("Checking order completion for order: {}", orderArg.getOrderNo());

        // Reload order to ensure we have the latest product data (especially accepted
        // quantities)
        Order order = orderRepository.findById(orderArg.getId())
                .orElse(orderArg);

        boolean allAccepted = order.getProducts().stream()
                .allMatch(OrderProduct::isFullyAccepted);

        log.info("Order {}: allAccepted = {}", order.getOrderNo(), allAccepted);

        if (allAccepted) {
            log.info("All products accepted for order {} - order remains IN_PROGRESS until shipped",
                    order.getOrderNo());

            if (order.getStatus() == OrderStatus.PENDING_ACCEPTANCE) {
                order.setStatus(OrderStatus.IN_PROGRESS);
                orderRepository.save(order);
            }

            // AUTO-SHIPMENT LOGIC
            log.info("Checking auto-shipment for order type: {}", order.getOrderType());

            if (order.getOrderType() == OrderType.CUSTOMER_SPECIFIC
                    || order.getOrderType() == OrderType.AFTER_SALES_SERVICE) {

                // Get pending shipments to avoid double shipping
                List<Shipment> activeShipments = shipmentRepository.findByOrder(order).stream()
                        .filter(s -> s.getStatus() != com.stokmate.domain.ShipmentStatus.FINALIZED)
                        .collect(Collectors.toList());

                log.info("Found {} active shipments for order {}", activeShipments.size(), order.getOrderNo());

                List<ProductShipmentRequest> itemsToShip = new ArrayList<>();
                for (OrderProduct op : order.getProducts()) {
                    BigDecimal pendingQty = activeShipments.stream()
                            .flatMap(s -> s.getItems().stream())
                            .filter(item -> item.getOrderProduct() != null
                                    && item.getOrderProduct().getId().equals(op.getId()))
                            .map(item -> BigDecimal.valueOf(item.getShippedQuantity()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal availableQty = op.getRemainingShipQuantity().subtract(pendingQty);

                    log.info("Product {}: Accepted={}, Shipped={}, Pending={}, Available={}",
                            op.getProductName(), op.getAcceptedQuantity(), op.getShippedQuantity(), pendingQty,
                            availableQty);

                    if (availableQty.compareTo(BigDecimal.ZERO) > 0) {
                        itemsToShip.add(ProductShipmentRequest.builder()
                                .orderProductId(op.getId())
                                .quantityToShip(availableQty)
                                .build());
                    }
                }

                log.info("Found {} items to auto-ship", itemsToShip.size());

                if (!itemsToShip.isEmpty()) {
                    log.info("Auto-creating shipment for order {} with {} items", order.getOrderNo(),
                            itemsToShip.size());
                    PartialShipmentRequest shipmentRequest = PartialShipmentRequest.builder()
                            .orderId(order.getId())
                            .productShipments(itemsToShip)
                            .notes(String.format("Otomatik oluşturulan sevkiyat (Tüm ürünler kabul edildi) - %s",
                                    LocalDateTime.now()
                                            .format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))))
                            .build();

                    try {
                        shipmentService.createPartialShipment(shipmentRequest, user.getId());
                        log.info("Successfully auto-created shipment for order {}", order.getOrderNo());
                    } catch (Exception e) {
                        log.error("Failed to auto-create shipment for order {}", order.getOrderNo(), e);
                    }
                }
            } else {
                log.info("Order type {} not eligible for auto-shipment", order.getOrderType());
            }
        }
    }

    // =============== ADMIN/MANAGER DELETE FUNCTIONALITY ===============

    /**
     * Delete a product acceptance (Admin/Manager only)
     * This will rollback the accepted quantity and related changes
     */
    @Transactional
    public void deleteAcceptance(String acceptanceId, User user) {
        // Permission check
        if (!user.getRole().canDeleteProductAcceptances()) {
            throw new BadRequestException("Bu işlem için yetkiniz yok");
        }

        ProductAcceptance acceptance = productAcceptanceRepository.findById(acceptanceId)
                .orElseThrow(() -> new NotFoundException("Ürün kabul kaydı bulunamadı"));

        OrderProduct orderProduct = acceptance.getOrderProduct();
        Order order = orderProduct.getOrder();
        BigDecimal acceptedQty = acceptance.getAcceptedQuantity();

        // Rollback accepted quantity on OrderProduct
        BigDecimal currentAccepted = orderProduct.getAcceptedQuantity();
        BigDecimal newAccepted = currentAccepted.subtract(acceptedQty);
        orderProduct.setAcceptedQuantity(newAccepted.max(BigDecimal.ZERO));
        orderProductRepository.save(orderProduct);

        // For STOCK orders, rollback stock changes
        if (order.getOrderType() == OrderType.STOCK) {
            Product product = productRepository.findByCode(orderProduct.getProductCode()).orElse(null);

            if (product != null) {
                boolean isCancelledStock = order.isConvertedFromCustomer();

                if (isCancelledStock) {
                    // Rollback cancelled stock quantity
                    BigDecimal oldCancelledQty = product.getCancelledStockQuantity();
                    BigDecimal newCancelledQty = oldCancelledQty.subtract(acceptedQty);
                    product.setCancelledStockQuantity(newCancelledQty.max(BigDecimal.ZERO));
                    productRepository.save(product);

                    // Create rollback event
                    ProductEvent rollbackEvent = new ProductEvent();
                    rollbackEvent.setProduct(product);
                    rollbackEvent.setEventType("CANCELLED_STOCK_DELETION");
                    rollbackEvent.setQuantityChange(acceptedQty.negate());
                    rollbackEvent.setDescription(
                            String.format("İptal stoğu kabulü silindi - Sipariş: %s", order.getOrderNo()));
                    rollbackEvent.setCreatedBy(user);
                    rollbackEvent.setCreatedAt(LocalDateTime.now());
                    productEventRepository.save(rollbackEvent);
                } else {
                    // Create stock decrease event
                    ProductEvent rollbackEvent = new ProductEvent();
                    rollbackEvent.setProduct(product);
                    rollbackEvent.setEventType("STOCK_ACCEPTANCE_DELETED");
                    rollbackEvent.setQuantityChange(acceptedQty.negate());
                    rollbackEvent.setDescription(String.format("Ürün kabulü silindi - Sipariş: %s - Silen: %s %s",
                            order.getOrderNo(), user.getFirstName(), user.getLastName()));
                    rollbackEvent.setCreatedBy(user);
                    rollbackEvent.setCreatedAt(LocalDateTime.now());
                    productEventRepository.save(rollbackEvent);
                }
            }
        }

        // Delete acceptance images from storage
        if (acceptance.getImagePaths() != null) {
            for (String imagePath : acceptance.getImagePaths()) {
                try {
                    storageService.delete(imagePath);
                } catch (Exception e) {
                    log.warn("Failed to delete acceptance image: {}", imagePath, e);
                }
            }
        }

        // Delete the acceptance
        productAcceptanceRepository.delete(acceptance);

        log.info("Product acceptance {} deleted by user {} for order {}",
                acceptanceId, user.getId(), order.getOrderNo());
    }
}
