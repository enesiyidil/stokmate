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
        productRepository.delete(product);
    }

    public Page<ProductResponse> list(String name, String brand, Boolean activeForSale, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.filter(name, brand, activeForSale);
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
                    .vatRate(response.getVatRate())
                    .unitPrice(response.getUnitPrice())
                    .minStockLevel(response.getMinStockLevel())
                    .keywords(response.getKeywords())
                    .createdAt(response.getCreatedAt())
                    .updatedAt(response.getUpdatedAt())
                    .createdBy(response.getCreatedBy())
                    .build();
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
}
