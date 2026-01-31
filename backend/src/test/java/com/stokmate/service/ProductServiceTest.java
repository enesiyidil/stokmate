package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Product;
import com.stokmate.domain.ProductStockHistory;
import com.stokmate.domain.NotificationType;
import com.stokmate.domain.Role;
import com.stokmate.dto.product.ProductRequest;
import com.stokmate.dto.product.ProductResponse;
import com.stokmate.dto.product.StockAdjustmentRequest;
import com.stokmate.dto.product.ProductEventResponse;
import com.stokmate.dto.product.ProductPriceHistoryResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.ProductMapper;
import com.stokmate.mapper.ProductEventMapper;
import com.stokmate.mapper.ProductPriceHistoryMapper;
import com.stokmate.mapper.ProductStockHistoryMapper;
import com.stokmate.repository.ProductRepository;
import com.stokmate.repository.ProductEventRepository;
import com.stokmate.repository.ProductPriceHistoryRepository;
import com.stokmate.repository.ProductStockHistoryRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private StorageService storageService;

    @Mock
    private ProductEventRepository productEventRepository;

    @Mock
    private ProductPriceHistoryRepository productPriceHistoryRepository;

    @Mock
    private ProductEventMapper productEventMapper;

    @Mock
    private ProductPriceHistoryMapper productPriceHistoryMapper;

    @Mock
    private ProductStockHistoryRepository productStockHistoryRepository;

    @Mock
    private ProductStockHistoryMapper productStockHistoryMapper;

    @Mock
    private InAppNotificationService inAppNotificationService;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(
                productRepository,
                productMapper,
                storageService,
                productEventRepository,
                productPriceHistoryRepository,
                productEventMapper,
                productPriceHistoryMapper,
                productStockHistoryRepository,
                productStockHistoryMapper,
                inAppNotificationService);
    }

    // ========== Helper Methods ==========

    private Product createProduct() {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setName("Test Product");
        p.setCode("PROD001");
        p.setActiveForSale(true);
        p.setStockQuantity(BigDecimal.TEN);
        p.setVatRate(BigDecimal.valueOf(18));
        p.setArrivalPrice(BigDecimal.valueOf(100));
        p.setMinStockLevel(BigDecimal.valueOf(5));
        return p;
    }

    private ProductResponse createProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .code(product.getCode())
                .stockQuantity(product.getStockQuantity())
                .activeForSale(product.isActiveForSale())
                .vatRate(product.getVatRate())
                .build();
    }

    // ========== Create Tests ==========

    @Nested
    @DisplayName("create() Tests")
    class CreateTests {

        @Test
        @DisplayName("Should create product successfully")
        void create_ShouldCreateProduct_WhenCodeNotExists() {
            // Arrange
            ProductRequest request = new ProductRequest();
            request.setCode("NEW001");
            request.setName("New Product");

            Product product = createProduct();
            ProductResponse response = createProductResponse(product);

            when(productRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(productMapper.toEntity(request)).thenReturn(product);
            when(productRepository.save(product)).thenReturn(product);
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            ProductResponse result = productService.create(request);

            // Assert
            assertThat(result).isNotNull();
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("Should throw exception when code already exists")
        void create_ShouldThrowException_WhenCodeExists() {
            // Arrange
            ProductRequest request = new ProductRequest();
            request.setCode("EXISTING");

            when(productRepository.findByCode("EXISTING")).thenReturn(Optional.of(createProduct()));

            // Act & Assert
            assertThatThrownBy(() -> productService.create(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Product code already exists");
        }

        @Test
        @DisplayName("Should set keywords from request")
        void create_ShouldSetKeywords_WhenProvided() {
            // Arrange
            ProductRequest request = new ProductRequest();
            request.setCode("NEW001");
            request.setKeywords(java.util.Set.of("keyword1", "keyword2"));

            Product product = createProduct();
            product.setKeywords(null);
            ProductResponse response = createProductResponse(product);

            when(productRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(productMapper.toEntity(request)).thenReturn(product);
            when(productRepository.save(any())).thenReturn(product);
            when(productMapper.toResponse(any())).thenReturn(response);

            // Act
            productService.create(request);

            // Assert
            assertThat(product.getKeywords()).isEqualTo("keyword1,keyword2");
        }
    }

    // ========== CreateBatch Tests ==========

    @Nested
    @DisplayName("createBatch() Tests")
    class CreateBatchTests {

        @Test
        @DisplayName("Should create multiple products")
        void createBatch_ShouldCreateAllProducts() {
            // Arrange
            ProductRequest request1 = new ProductRequest();
            request1.setCode("BATCH001");
            ProductRequest request2 = new ProductRequest();
            request2.setCode("BATCH002");

            Product product = createProduct();
            ProductResponse response = createProductResponse(product);

            when(productRepository.findByCode(anyString())).thenReturn(Optional.empty());
            when(productMapper.toEntity(any())).thenReturn(product);
            when(productRepository.save(any())).thenReturn(product);
            when(productMapper.toResponse(any())).thenReturn(response);

            // Act
            List<ProductResponse> result = productService.createBatch(List.of(request1, request2));

            // Assert
            assertThat(result).hasSize(2);
            verify(productRepository, times(2)).save(any());
        }

        @Test
        @DisplayName("Should throw exception if any code exists")
        void createBatch_ShouldThrowException_WhenAnyCodeExists() {
            // Arrange
            ProductRequest request1 = new ProductRequest();
            request1.setCode("NEW001");
            ProductRequest request2 = new ProductRequest();
            request2.setCode("EXISTING");

            when(productRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(productRepository.findByCode("EXISTING")).thenReturn(Optional.of(createProduct()));

            // Act & Assert
            assertThatThrownBy(() -> productService.createBatch(List.of(request1, request2)))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ========== Update Tests ==========

    @Nested
    @DisplayName("update() Tests")
    class UpdateTests {

        @Test
        @DisplayName("Should update product successfully")
        void update_ShouldUpdateProduct_WhenExists() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            product.setId(productId);
            product.setCode("PROD001");

            ProductRequest request = new ProductRequest();
            request.setCode("PROD001");
            request.setName("Updated Name");

            ProductResponse response = createProductResponse(product);

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));
            when(productRepository.save(product)).thenReturn(product);
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            ProductResponse result = productService.update(productId, request);

            // Assert
            verify(productMapper).updateProductFromRequest(request, product);
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("Should throw exception when product not found")
        void update_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID productId = UUID.randomUUID();
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> productService.update(productId, new ProductRequest()))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when changing to existing code")
        void update_ShouldThrowException_WhenCodeChangesToExisting() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            product.setId(productId);
            product.setCode("ORIGINAL");

            ProductRequest request = new ProductRequest();
            request.setCode("EXISTING");

            Product existingProduct = createProduct();
            existingProduct.setCode("EXISTING");

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));
            when(productRepository.findByCode("EXISTING")).thenReturn(Optional.of(existingProduct));

            // Act & Assert
            assertThatThrownBy(() -> productService.update(productId, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Product code already exists");
        }
    }

    // ========== Delete Tests ==========

    @Nested
    @DisplayName("delete() Tests")
    class DeleteTests {

        @Test
        @DisplayName("Should delete product")
        void delete_ShouldDeleteProduct_WhenExists() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            when(productRepository.findById(productId)).thenReturn(Optional.of(product));

            // Act
            productService.delete(productId);

            // Assert
            verify(productRepository).delete(product);
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void delete_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID productId = UUID.randomUUID();
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> productService.delete(productId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== IncreaseStock Tests ==========

    @Nested
    @DisplayName("increaseStock() Tests")
    class IncreaseStockTests {

        @Test
        @DisplayName("Should add quantity to stock")
        void increaseStock_ShouldAddQuantity() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.TEN);

            StockAdjustmentRequest request = new StockAdjustmentRequest();
            request.setQuantity(BigDecimal.valueOf(5));
            request.setReason("restock");

            ProductResponse response = createProductResponse(product);
            response = ProductResponse.builder()
                    .stockQuantity(BigDecimal.valueOf(15))
                    .build();

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            ProductResponse result = productService.increaseStock(productId, request);

            // Assert
            assertThat(product.getStockQuantity()).isEqualByComparingTo("15");
            verify(productRepository).save(product);
        }
    }

    // ========== DecreaseStock Tests ==========

    @Nested
    @DisplayName("decreaseStock() Tests")
    class DecreaseStockTests {

        @Test
        @DisplayName("Should subtract quantity from stock")
        void decreaseStock_ShouldSubtractQuantity() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.TEN);

            StockAdjustmentRequest request = new StockAdjustmentRequest();
            request.setQuantity(BigDecimal.valueOf(3));
            request.setReason("sale");

            ProductResponse response = createProductResponse(product);

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            productService.decreaseStock(productId, request);

            // Assert
            assertThat(product.getStockQuantity()).isEqualByComparingTo("7");
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("Should throw exception when insufficient stock")
        void decreaseStock_ShouldThrowException_WhenInsufficientStock() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.TEN);

            StockAdjustmentRequest request = new StockAdjustmentRequest();
            request.setQuantity(BigDecimal.valueOf(20));
            request.setReason("sale");

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));

            // Act & Assert
            assertThatThrownBy(() -> productService.decreaseStock(productId, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Stock cannot go below zero");
        }

        @Test
        @DisplayName("Should allow decrease to exactly zero")
        void decreaseStock_ShouldAllowDecreaseToZero() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.TEN);

            StockAdjustmentRequest request = new StockAdjustmentRequest();
            request.setQuantity(BigDecimal.TEN);
            request.setReason("sale");

            ProductResponse response = createProductResponse(product);

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            productService.decreaseStock(productId, request);

            // Assert
            assertThat(product.getStockQuantity()).isEqualByComparingTo("0");
        }
    }

    // ========== FindByCodeOrId Tests ==========

    @Nested
    @DisplayName("findByCodeOrId() Tests")
    class FindByCodeOrIdTests {

        @Test
        @DisplayName("Should find by ID when provided")
        void findByCodeOrId_ShouldFindById_WhenIdProvided() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            when(productRepository.findById(productId)).thenReturn(Optional.of(product));

            // Act
            Product result = productService.findByCodeOrId(null, productId);

            // Assert
            assertThat(result).isEqualTo(product);
        }

        @Test
        @DisplayName("Should find by code when ID is null")
        void findByCodeOrId_ShouldFindByCode_WhenIdIsNull() {
            // Arrange
            Product product = createProduct();
            when(productRepository.findByCode("PROD001")).thenReturn(Optional.of(product));

            // Act
            Product result = productService.findByCodeOrId("PROD001", null);

            // Assert
            assertThat(result).isEqualTo(product);
        }

        @Test
        @DisplayName("Should throw exception when both are null/empty")
        void findByCodeOrId_ShouldThrowException_WhenBothNull() {
            // Act & Assert
            assertThatThrownBy(() -> productService.findByCodeOrId(null, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Product reference is required");
        }

        @Test
        @DisplayName("Should throw exception when code not found")
        void findByCodeOrId_ShouldThrowException_WhenCodeNotFound() {
            // Arrange
            when(productRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> productService.findByCodeOrId("UNKNOWN", null))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== Get Tests ==========

    @Nested
    @DisplayName("get() Tests")
    class GetTests {

        @Test
        @DisplayName("Should return product response")
        void get_ShouldReturnProductResponse() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            ProductResponse response = createProductResponse(product);

            when(productRepository.findById(productId)).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            ProductResponse result = productService.get(productId);

            // Assert
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void get_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID productId = UUID.randomUUID();
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> productService.get(productId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== List Tests ==========

    @Nested
    @DisplayName("list() Tests")
    class ListTests {

        @Test
        @DisplayName("Should return paginated products")
        void list_ShouldReturnPaginatedProducts() {
            // Arrange
            Product product = createProduct();
            Page<Product> productPage = new PageImpl<>(List.of(product));
            ProductResponse response = createProductResponse(product);

            when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(productPage);
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            Page<ProductResponse> result = productService.list(null, null, null, Pageable.unpaged());

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }

    // ========== Search Tests ==========

    @Nested
    @DisplayName("search() Tests")
    class SearchTests {

        @Test
        @DisplayName("Should search products")
        void search_ShouldReturnMatchingProducts() {
            // Arrange
            Product product = createProduct();
            Page<Product> productPage = new PageImpl<>(List.of(product));
            ProductResponse response = createProductResponse(product);

            when(productRepository.search(anyString(), any(Pageable.class))).thenReturn(productPage);
            when(productMapper.toResponse(product)).thenReturn(response);

            // Act
            Page<ProductResponse> result = productService.search("test", Pageable.unpaged());

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should handle empty search query")
        void search_ShouldHandleEmptyQuery() {
            // Arrange
            Page<Product> emptyPage = Page.empty();
            when(productRepository.search("", any(Pageable.class))).thenReturn(emptyPage);

            // Act
            Page<ProductResponse> result = productService.search("", Pageable.unpaged());

            // Assert
            assertThat(result.getContent()).isEmpty();
        }
    }

    // ========== GetEvents Tests ==========

    @Nested
    @DisplayName("getEvents() Tests")
    class GetEventsTests {

        @Test
        @DisplayName("Should return product events")
        void getEvents_ShouldReturnEvents() {
            // Arrange
            UUID productId = UUID.randomUUID();
            when(productEventRepository.findByProductIdOrderByCreatedAtDesc(productId))
                    .thenReturn(List.of());

            // Act
            List<ProductEventResponse> result = productService.getEvents(productId);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== GetPriceHistory Tests ==========

    @Nested
    @DisplayName("getPriceHistory() Tests")
    class GetPriceHistoryTests {

        @Test
        @DisplayName("Should return price history")
        void getPriceHistory_ShouldReturnHistory() {
            // Arrange
            UUID productId = UUID.randomUUID();
            when(productPriceHistoryRepository.findByProductIdOrderByCreatedAtDesc(productId))
                    .thenReturn(List.of());

            // Act
            List<ProductPriceHistoryResponse> result = productService.getPriceHistory(productId);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== CheckAndNotifyLowStock Tests ==========

    @Nested
    @DisplayName("checkAndNotifyLowStock() Tests")
    class CheckAndNotifyLowStockTests {

        @Test
        @DisplayName("Should send notification when stock below minimum")
        void checkAndNotifyLowStock_ShouldNotify_WhenBelowMinimum() {
            // Arrange
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.valueOf(3));
            product.setMinStockLevel(BigDecimal.valueOf(5));

            // Act
            productService.checkAndNotifyLowStock(product);

            // Assert
            verify(inAppNotificationService).createNotificationForRoles(
                    eq(NotificationType.LOW_STOCK),
                    anyString(),
                    anyString(),
                    anyString(),
                    any());
        }

        @Test
        @DisplayName("Should not notify when stock above minimum")
        void checkAndNotifyLowStock_ShouldNotNotify_WhenAboveMinimum() {
            // Arrange
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.valueOf(10));
            product.setMinStockLevel(BigDecimal.valueOf(5));

            // Act
            productService.checkAndNotifyLowStock(product);

            // Assert
            verify(inAppNotificationService, never()).createNotificationForRoles(
                    any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should not notify when no minimum level set")
        void checkAndNotifyLowStock_ShouldNotNotify_WhenNoMinimum() {
            // Arrange
            Product product = createProduct();
            product.setMinStockLevel(null);

            // Act
            productService.checkAndNotifyLowStock(product);

            // Assert
            verify(inAppNotificationService, never()).createNotificationForRoles(
                    any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should notify when stock equals minimum")
        void checkAndNotifyLowStock_ShouldNotify_WhenEqualsMinimum() {
            // Arrange
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.valueOf(5));
            product.setMinStockLevel(BigDecimal.valueOf(5));

            // Act
            productService.checkAndNotifyLowStock(product);

            // Assert
            verify(inAppNotificationService).createNotificationForRoles(
                    eq(NotificationType.LOW_STOCK),
                    anyString(),
                    anyString(),
                    anyString(),
                    any());
        }

        @Test
        @DisplayName("Should include cancelled stock in calculation")
        void checkAndNotifyLowStock_ShouldIncludeCancelledStock() {
            // Arrange
            Product product = createProduct();
            product.setStockQuantity(BigDecimal.valueOf(3));
            product.setCancelledStockQuantity(BigDecimal.valueOf(3));
            product.setMinStockLevel(BigDecimal.valueOf(5));

            // Act
            productService.checkAndNotifyLowStock(product);

            // Assert - total is 6, which is above 5, so no notification
            verify(inAppNotificationService, never()).createNotificationForRoles(
                    any(), any(), any(), any(), any());
        }
    }

    // ========== GetEntity Tests ==========

    @Nested
    @DisplayName("getEntity() Tests")
    class GetEntityTests {

        @Test
        @DisplayName("Should return entity when exists")
        void getEntity_ShouldReturnEntity_WhenExists() {
            // Arrange
            UUID productId = UUID.randomUUID();
            Product product = createProduct();
            when(productRepository.findById(productId)).thenReturn(Optional.of(product));

            // Act
            Product result = productService.getEntity(productId);

            // Assert
            assertThat(result).isEqualTo(product);
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void getEntity_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID productId = UUID.randomUUID();
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> productService.getEntity(productId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Product not found");
        }
    }
}
