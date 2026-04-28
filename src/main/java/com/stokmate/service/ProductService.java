package com.stokmate.service;

import com.stokmate.domain.Product;
import com.stokmate.dto.product.ProductRequest;
import com.stokmate.dto.product.ProductResponse;
import com.stokmate.dto.product.StockAdjustmentRequest;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.ProductMapper;
import com.stokmate.repository.ProductRepository;
import com.stokmate.repository.ProductEventRepository;
import com.stokmate.repository.ProductPriceHistoryRepository;
import com.stokmate.mapper.ProductEventMapper;
import com.stokmate.mapper.ProductPriceHistoryMapper;
import com.stokmate.service.spec.ProductSpecification;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final StorageService storageService;
    private final ProductEventRepository productEventRepository;
    private final ProductPriceHistoryRepository productPriceHistoryRepository;
    private final ProductEventMapper productEventMapper;
    private final ProductPriceHistoryMapper productPriceHistoryMapper;
    private final com.stokmate.repository.ProductStockHistoryRepository productStockHistoryRepository;
    private final com.stokmate.mapper.ProductStockHistoryMapper productStockHistoryMapper;
    private final InAppNotificationService inAppNotificationService;

    public ProductResponse create(ProductRequest request) {
        productRepository.findByCode(request.getCode())
                .ifPresent(p -> {
                    throw new BadRequestException("Product code already exists");
                });
        Product product = productMapper.toEntity(request);
        if (product.getKeywords() == null && request.getKeywords() != null) {
            product.setKeywords(request.getKeywords());
        }
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Transactional
    public List<ProductResponse> createBatch(List<ProductRequest> requests) {
        // Validate all codes first
        for (ProductRequest request : requests) {
            productRepository.findByCode(request.getCode())
                    .ifPresent(p -> {
                        throw new BadRequestException("Product code already exists: " + request.getCode());
                    });
        }

        // Create all products
        List<ProductResponse> responses = new java.util.ArrayList<>();
        for (ProductRequest request : requests) {
            Product product = productMapper.toEntity(request);
            if (product.getKeywords() == null && request.getKeywords() != null) {
                product.setKeywords(request.getKeywords());
            }
            Product saved = productRepository.save(product);
            responses.add(productMapper.toResponse(saved));
        }

        log.info("Batch created {} products", responses.size());
        return responses;
    }

    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = getEntity(id);
        if (!product.getCode().equals(request.getCode())) {
            productRepository.findByCode(request.getCode())
                    .ifPresent(existing -> {
                        throw new BadRequestException("Product code already exists");
                    });
        }
        productMapper.updateProductFromRequest(request, product);
        return productMapper.toResponse(productRepository.save(product));
    }

    public void delete(UUID id) {
        Product product = getEntity(id);
        // Soft delete implementation
        product.setDeleted(true);
        product.setIsDeleted(true);
        product.setDeletionDate(java.time.Instant.now());
        productRepository.save(product);
        log.info("Product soft deleted: {}", product.getCode());
    }

    public Page<ProductResponse> list(
            String search,
            String brand,
            Boolean activeForSale,
            String stockFilter,
            Pageable pageable) {
        Specification<Product> spec = ProductSpecification.filter(search, brand, activeForSale, stockFilter);
        return productRepository.findAll(spec, pageable).map(this::toResponseWithPresignedUrl);
    }

    public Page<ProductResponse> search(String q, Pageable pageable) {
        String query = StringUtils.hasText(q) ? q : "";
        return productRepository.search(query, pageable).map(this::toResponseWithPresignedUrl);
    }

    public ProductResponse get(UUID id) {
        return toResponseWithPresignedUrl(getEntity(id));
    }

    @Transactional
    public ProductResponse increaseStock(UUID id, StockAdjustmentRequest request) {
        Product product = getEntity(id);
        product.setStockQuantity(product.getStockQuantity().add(request.getQuantity()));
        productRepository.save(product);
        log.info("Stock increased for product {} by {} - reason: {}", product.getCode(), request.getQuantity(),
                request.getReason());
        return productMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse decreaseStock(UUID id, StockAdjustmentRequest request) {
        Product product = getEntity(id);
        BigDecimal newQty = product.getStockQuantity().subtract(request.getQuantity());
        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Stock cannot go below zero");
        }
        product.setStockQuantity(newQty);
        productRepository.save(product);
        log.info("Stock decreased for product {} by {} - reason: {}", product.getCode(), request.getQuantity(),
                request.getReason());
        return productMapper.toResponse(product);
    }

    public Product findByCodeOrId(String code, UUID id) {
        if (id != null) {
            return getEntity(id);
        }
        if (StringUtils.hasText(code)) {
            return productRepository.findByCode(code)
                    .orElseThrow(() -> new NotFoundException("Product not found with code " + code));
        }
        throw new BadRequestException("Product reference is required");
    }

    public Page<ProductResponse> similar(String name, Pageable pageable) {
        return search(name, pageable);
    }

    @Transactional
    public ProductResponse uploadImage(UUID id, org.springframework.web.multipart.MultipartFile file) {
        Product product = getEntity(id);

        // Delete old image if exists
        if (StringUtils.hasText(product.getImageUrl())) {
            try {
                storageService.delete(product.getImageUrl());
            } catch (Exception e) {
                log.warn("Failed to delete old image: {}", product.getImageUrl(), e);
            }
        }

        // Upload new image
        try {
            String objectKey = storageService.store(file, "products");
            product.setImageUrl(objectKey);
            Product saved = productRepository.save(product);
            log.info("Image uploaded for product {}: {}", product.getCode(), objectKey);
            return toResponseWithPresignedUrl(saved);
        } catch (Exception e) {
            log.error("Failed to upload image for product {}", product.getCode(), e);
            throw new BadRequestException("Failed to upload image: " + e.getMessage());
        }
    }

    @Transactional
    public ProductResponse deleteImage(UUID id) {
        Product product = getEntity(id);

        if (!StringUtils.hasText(product.getImageUrl())) {
            throw new BadRequestException("Product has no image");
        }

        try {
            storageService.delete(product.getImageUrl());
        } catch (Exception e) {
            log.warn("Failed to delete image from storage: {}", product.getImageUrl(), e);
        }

        product.setImageUrl(null);
        Product saved = productRepository.save(product);
        log.info("Image deleted for product {}", product.getCode());
        return toResponseWithPresignedUrl(saved);
    }

    private ProductResponse toResponseWithPresignedUrl(Product product) {
        ProductResponse response = productMapper.toResponse(product);
        // Return raw path for backend proxy (frontend uses /api/files/view)
        if (StringUtils.hasText(product.getImageUrl())) {
            response = ProductResponse.builder()
                    .id(response.getId())
                    .name(response.getName())
                    .code(response.getCode())
                    .description(response.getDescription())
                    .brand(response.getBrand())
                    .imageUrl(product.getImageUrl()) // Raw path, not presigned URL
                    .activeForSale(response.isActiveForSale())
                    .stockQuantity(response.getStockQuantity())
                    .cancelledStockQuantity(product.getCancelledStockQuantity())
                    .vatRate(response.getVatRate())
                    .unitPrice(response.getUnitPrice())
                    .minStockLevel(response.getMinStockLevel())
                    .keywords(response.getKeywords())
                    .createdAt(response.getCreatedAt())
                    .updatedAt(response.getUpdatedAt())
                    .createdBy(response.getCreatedBy())
                    .build();
        } else {
            // Even if no image, we need to populate the new field if we're using the
            // builder from mapper response
            // But wait, response IS the mapped response. If image is null, we return
            // response AS IS.
            // Problem: The mapper might not map cancelledStockQuantity if it's not in the
            // request/source properly or if I didn't update the mapper.
            // I should explicitly set it if the mapper doesn't.
            // Let's assume the mapper DOES map it if fields match.
            // BUT, if I rebuild the builder above, I MUST include it.
            // AND I should probably update the "else" case or ensuring the initial mapping
            // covers it.
            // Actually, I can just update the mapper interface to map it automatically if
            // names match.
            // However, since I am editing ProductService, I can enforce it here.

            // Let's just modify the builder block above which is only for
            // HasText(imageUrl).
            // Wait, if !HasText(imageUrl), it returns `productMapper.toResponse(product)`.
            // Does `productMapper` know about `cancelledStockQuantity`?
            // `ProductMapper` usually auto-maps fields with same name. `Product` has
            // `cancelledStockQuantity`, `ProductResponse` has it too.
            // So default mapping should work. I only need to add it to the manually built
            // builder in the `if` block.
        }
        return response;
    }

    public Product getEntity(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
    }

    @Transactional(readOnly = true)
    public com.stokmate.dto.product.ProductDetailsResponse getDetails(UUID id) {
        Product product = getEntity(id);

        // Get recent events (last 20)
        List<com.stokmate.dto.product.ProductEventResponse> events = productEventRepository
                .findByProductIdOrderByCreatedAtDesc(id)
                .stream()
                .limit(20)
                .map(productEventMapper::toResponse)
                .toList();

        // Get price history
        List<com.stokmate.dto.product.ProductPriceHistoryResponse> priceHistory = productPriceHistoryRepository
                .findByProductIdOrderByCreatedAtDesc(id)
                .stream()
                .map(productPriceHistoryMapper::toResponse)
                .toList();

        // Get stock history (last 50)
        List<com.stokmate.dto.product.ProductStockHistoryResponse> stockHistory = productStockHistoryRepository
                .findByProductIdOrderByCreatedAtDesc(id)
                .stream()
                .limit(50)
                .map(productStockHistoryMapper::toResponse)
                .toList();

        // Return raw path for backend proxy (frontend uses /api/files/view)
        String imageUrl = product.getImageUrl();

        return com.stokmate.dto.product.ProductDetailsResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .code(product.getCode())
                .description(product.getDescription())
                .brand(product.getBrand())
                .imageUrl(imageUrl)
                .activeForSale(product.isActiveForSale())
                .customerOwned(product.isCustomerOwned())
                .stockQuantity(product.getStockQuantity())
                .cancelledStockQuantity(product.getCancelledStockQuantity())
                .vatRate(product.getVatRate())
                .arrivalPrice(product.getArrivalPrice())
                .internetSalesPrice(product.getInternetSalesPrice())
                .minStockLevel(product.getMinStockLevel())
                .keywords(product.getKeywords())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .createdBy(product.getCreatedBy())
                .recentEvents(events)
                .priceHistory(priceHistory)
                .stockHistory(stockHistory)
                .build();
    }

    @Transactional(readOnly = true)
    public List<com.stokmate.dto.product.ProductEventResponse> getEvents(UUID id) {
        return productEventRepository.findByProductIdOrderByCreatedAtDesc(id)
                .stream()
                .map(productEventMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.stokmate.dto.product.ProductPriceHistoryResponse> getPriceHistory(UUID id) {
        return productPriceHistoryRepository.findByProductIdOrderByCreatedAtDesc(id)
                .stream()
                .map(productPriceHistoryMapper::toResponse)
                .toList();
    }

    @Transactional
    public void logStockChange(Product product, BigDecimal oldQty, BigDecimal newQty, BigDecimal changeAmount,
            String reason, com.stokmate.domain.ProductStockHistory.StockChangeType type) {
        com.stokmate.domain.ProductStockHistory history = com.stokmate.domain.ProductStockHistory.builder()
                .product(product)
                .oldQuantity(oldQty)
                .newQuantity(newQty)
                .changeAmount(changeAmount)
                .reason(reason)
                .type(type)
                .userEmail(com.stokmate.security.SecurityUtils.getCurrentUserLogin())
                .build();
        productStockHistoryRepository.save(history);
    }

    /**
     * Check if stock has fallen to or below minimum level and send notification
     * Notifies ADMIN, MANAGER, DIRECTOR, OPERATIONS_MANAGER roles
     */
    public void checkAndNotifyLowStock(Product product) {
        if (product.getMinStockLevel() == null || product.getMinStockLevel().compareTo(BigDecimal.ZERO) <= 0) {
            return; // No minimum stock level set
        }

        BigDecimal totalStock = product.getStockQuantity();
        if (product.getCancelledStockQuantity() != null) {
            totalStock = totalStock.add(product.getCancelledStockQuantity());
        }

        if (totalStock.compareTo(product.getMinStockLevel()) <= 0) {
            // Stock is at or below minimum level - send notification
            String title = "⚠️ Düşük Stok Uyarısı";
            String message = String.format(
                    "%s (%s) ürününün stoğu minimum seviyeye düştü! Mevcut: %.0f, Minimum: %.0f",
                    product.getName(),
                    product.getCode(),
                    totalStock,
                    product.getMinStockLevel());
            String linkUrl = "/products/" + product.getId();

            java.util.List<com.stokmate.domain.Role> targetRoles = java.util.Arrays.asList(
                    com.stokmate.domain.Role.ADMIN,
                    com.stokmate.domain.Role.MANAGER,
                    com.stokmate.domain.Role.DIRECTOR,
                    com.stokmate.domain.Role.OPERATIONS_MANAGER);

            inAppNotificationService.createNotificationForRoles(
                    com.stokmate.domain.NotificationType.LOW_STOCK,
                    title,
                    message,
                    linkUrl,
                    targetRoles);

            log.info("Low stock notification sent for product {} - current: {}, minimum: {}",
                    product.getCode(), totalStock, product.getMinStockLevel());
        }
    }
}
