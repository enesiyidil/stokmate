package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.stokmate.domain.Product;
import com.stokmate.dto.product.StockAdjustmentRequest;
import com.stokmate.exception.BadRequestException;
import com.stokmate.mapper.ProductMapper;
import com.stokmate.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private com.stokmate.repository.ProductEventRepository productEventRepository;

    @Mock
    private com.stokmate.repository.ProductPriceHistoryRepository productPriceHistoryRepository;

    @Mock
    private com.stokmate.mapper.ProductEventMapper productEventMapper;

    @Mock
    private com.stokmate.mapper.ProductPriceHistoryMapper productPriceHistoryMapper;

    private ProductService productService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        ProductMapper mapper = Mappers.getMapper(ProductMapper.class);
        productService = new ProductService(
                productRepository,
                mapper,
                storageService,
                productEventRepository,
                productPriceHistoryRepository,
                productEventMapper,
                productPriceHistoryMapper);
    }

    @Test
    void increaseStockShouldAddQuantity() {
        Product product = sampleProduct();
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setQuantity(BigDecimal.valueOf(5));
        request.setReason("restock");

        var response = productService.increaseStock(product.getId(), request);

        assertThat(response.getStockQuantity()).isEqualByComparingTo("15");
    }

    @Test
    void decreaseStockShouldValidate() {
        Product product = sampleProduct();
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setQuantity(BigDecimal.valueOf(20));
        request.setReason("sale");

        assertThatThrownBy(() -> productService.decreaseStock(product.getId(), request))
                .isInstanceOf(BadRequestException.class);
    }

    private Product sampleProduct() {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setName("Test");
        p.setCode("T1");
        p.setActiveForSale(true);
        p.setStockQuantity(BigDecimal.TEN);
        p.setVatRate(BigDecimal.valueOf(18));
        p.setArrivalPrice(BigDecimal.valueOf(100));
        return p;
    }
}
