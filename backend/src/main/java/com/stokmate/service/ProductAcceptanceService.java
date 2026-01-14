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

                // Create ProductEvent for stock increase
                com.stokmate.domain.ProductEvent productEvent = new com.stokmate.domain.ProductEvent();
                productEvent.setProduct(product);
                productEvent.setEventType("STOCK_ACCEPTANCE");
                productEvent.setQuantityChange(request.getAcceptedQuantity());
                productEvent.setDescription(String.format("Ürün kabul edildi - Sipariş: %s", order.getOrderNo()));
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
        checkAndCompleteOrder(orderProduct.getOrder());

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

    private void checkAndCompleteOrder(Order order) {
        // With simplified status system, order stays IN_PROGRESS until all products are
        // SHIPPED
        // This method now just ensures order is in valid state (not auto-completing on
        // acceptance)
        boolean allAccepted = order.getProducts().stream()
                .allMatch(OrderProduct::isFullyAccepted);

        if (allAccepted) {
            log.info("All products accepted for order {} - order remains IN_PROGRESS until shipped",
                    order.getOrderNo());
            // Order stays IN_PROGRESS, will be completed by shipment finalization
            if (order.getStatus() == OrderStatus.PENDING_ACCEPTANCE) {
                order.setStatus(OrderStatus.IN_PROGRESS);
                orderRepository.save(order);
            }
        }
    }
}
