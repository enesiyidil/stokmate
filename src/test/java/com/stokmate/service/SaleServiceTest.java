/*
 * package com.stokmate.service;
 * 
 * import static org.assertj.core.api.Assertions.assertThat;
 * import static org.mockito.ArgumentMatchers.any;
 * import static org.mockito.Mockito.when;
 * 
 * import com.stokmate.domain.Product;
 * import com.stokmate.domain.Sale;
 * import com.stokmate.domain.User;
 * import com.stokmate.dto.sale.SaleItemRequest;
 * import com.stokmate.dto.sale.SaleRequest;
 * import com.stokmate.dto.sale.SaleResponse;
 * import com.stokmate.repository.SaleRepository;
 * import java.math.BigDecimal;
 * import java.util.List;
 * import java.util.UUID;
 * import org.junit.jupiter.api.BeforeEach;
 * import org.junit.jupiter.api.Test;
 * import org.mockito.ArgumentCaptor;
 * import org.mockito.Mock;
 * import org.mockito.MockitoAnnotations;
 * 
 * class SaleServiceTest {
 * 
 * @Mock
 * private SaleRepository saleRepository;
 * 
 * @Mock
 * private ProductService productService;
 * 
 * @Mock
 * private CustomerService customerService;
 * 
 * private SaleService saleService;
 * 
 * @BeforeEach
 * void setup() {
 * MockitoAnnotations.openMocks(this);
 * saleService = new SaleService(saleRepository, productService,
 * customerService);
 * }
 * 
 * @Test
 * void createSaleShouldDecreaseStockAndCalculateTotals() {
 * Product product = product();
 * when(productService.findByCodeOrId("P1", null)).thenReturn(product);
 * when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> {
 * Sale sale = invocation.getArgument(0);
 * sale.setId(UUID.randomUUID());
 * sale.getItems().forEach(item -> item.setId(UUID.randomUUID()));
 * return sale;
 * });
 * 
 * SaleItemRequest item = new SaleItemRequest();
 * item.setProductCode("P1");
 * item.setQuantity(BigDecimal.valueOf(2));
 * SaleRequest request = new SaleRequest();
 * request.setItems(List.of(item));
 * 
 * SaleResponse response = saleService.createSale(request, seller());
 * 
 * assertThat(product.getStockQuantity()).isEqualByComparingTo("8");
 * assertThat(response.getTotalGross()).isGreaterThan(BigDecimal.ZERO);
 * assertThat(response.getItems()).hasSize(1);
 * }
 * 
 * private Product product() {
 * Product p = new Product();
 * p.setId(UUID.randomUUID());
 * p.setCode("P1");
 * p.setName("Prod 1");
 * p.setActiveForSale(true);
 * p.setStockQuantity(BigDecimal.TEN);
 * p.setArrivalPrice(BigDecimal.valueOf(100));
 * p.setVatRate(BigDecimal.valueOf(20));
 * return p;
 * }
 * 
 * private User seller() {
 * User u = new User();
 * u.setId(UUID.randomUUID());
 * u.setEmail("seller@test.com");
 * return u;
 * }
 * }
 */
