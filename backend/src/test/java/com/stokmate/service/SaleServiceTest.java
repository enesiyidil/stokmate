package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.stokmate.domain.*;
import com.stokmate.dto.sale.*;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.SaleEventMapper;
import com.stokmate.mapper.SaleMapper;
import com.stokmate.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private SaleEventRepository saleEventRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SaleMapper saleMapper;

    @Mock
    private SaleEventMapper saleEventMapper;

    @Mock
    private StorageService storageService;

    @Mock
    private ProductAllocationService productAllocationService;

    private SaleService saleService;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(
                saleRepository,
                saleEventRepository,
                productRepository,
                customerRepository,
                userRepository,
                saleMapper,
                saleEventMapper,
                storageService,
                productAllocationService);
    }

    // ========== Helper Methods ==========

    private User createUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("seller@example.com");
        user.setFirstName("Seller");
        user.setLastName("User");
        user.setRole(Role.STORE_EMPLOYEE);
        return user;
    }

    private Customer createCustomer() {
        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setFirstName("John");
        customer.setLastName("Doe");
        return customer;
    }

    private Product createProduct() {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setCode("PROD001");
        product.setName("Test Product");
        product.setStockQuantity(BigDecimal.TEN);
        product.setVatRate(BigDecimal.valueOf(18));
        return product;
    }

    private Sale createSale() {
        Sale sale = new Sale();
        sale.setId(UUID.randomUUID());
        sale.setSaleNo("SL-123456");
        sale.setCustomer(createCustomer());
        sale.setSalesConsultant(createUser());
        sale.setStatus(SaleStatus.DEVAM_EDIYOR);
        sale.setSaleDate(LocalDate.now());
        return sale;
    }

    private SaleResponse createSaleResponse(Sale sale) {
        return SaleResponse.builder()
                .id(sale.getId())
                .saleNo(sale.getSaleNo())
                .status(sale.getStatus())
                .build();
    }

    // ========== Create Tests ==========

    @Nested
    @DisplayName("create() Tests")
    class CreateTests {

        @Test
        @DisplayName("Should create sale successfully")
        void create_ShouldCreateSale_WhenValidRequest() {
            // Arrange
            User user = createUser();
            Customer customer = createCustomer();
            Product product = createProduct();

            SaleProductRequest productRequest = new SaleProductRequest();
            productRequest.setProductId(product.getId());
            productRequest.setQuantity(2);
            productRequest.setUnitPriceExcludingVat(BigDecimal.valueOf(100));
            productRequest.setVatRate(BigDecimal.valueOf(18));

            SaleRequest request = new SaleRequest();
            request.setCustomerId(customer.getId());
            request.setProducts(List.of(productRequest));

            Sale savedSale = createSale();
            SaleResponse response = createSaleResponse(savedSale);

            when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
            when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
            when(saleRepository.save(any(Sale.class))).thenReturn(savedSale);
            when(saleMapper.toResponse(savedSale)).thenReturn(response);

            // Act
            SaleResponse result = saleService.create(request, user);

            // Assert
            assertThat(result).isNotNull();
            verify(saleRepository).save(any(Sale.class));
            verify(saleEventRepository).save(any(SaleEvent.class));
        }

        @Test
        @DisplayName("Should throw exception when customer not found")
        void create_ShouldThrowException_WhenCustomerNotFound() {
            // Arrange
            User user = createUser();
            UUID customerId = UUID.randomUUID();

            SaleRequest request = new SaleRequest();
            request.setCustomerId(customerId);

            when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saleService.create(request, user))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Customer not found");
        }

        @Test
        @DisplayName("Should throw exception when product not found")
        void create_ShouldThrowException_WhenProductNotFound() {
            // Arrange
            User user = createUser();
            Customer customer = createCustomer();
            UUID productId = UUID.randomUUID();

            SaleProductRequest productRequest = new SaleProductRequest();
            productRequest.setProductId(productId);
            productRequest.setQuantity(2);
            productRequest.setUnitPriceExcludingVat(BigDecimal.valueOf(100));
            productRequest.setVatRate(BigDecimal.valueOf(18));

            SaleRequest request = new SaleRequest();
            request.setCustomerId(customer.getId());
            request.setProducts(List.of(productRequest));

            when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saleService.create(request, user))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Product not found");
        }

        @Test
        @DisplayName("Should use different consultant when specified")
        void create_ShouldUseDifferentConsultant_WhenSpecified() {
            // Arrange
            User user = createUser();
            User consultant = createUser();
            consultant.setId(UUID.randomUUID());
            consultant.setEmail("consultant@example.com");

            Customer customer = createCustomer();

            SaleRequest request = new SaleRequest();
            request.setCustomerId(customer.getId());
            request.setSalesConsultantId(consultant.getId());

            Sale savedSale = createSale();
            SaleResponse response = createSaleResponse(savedSale);

            when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
            when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));
            when(saleRepository.save(any(Sale.class))).thenReturn(savedSale);
            when(saleMapper.toResponse(savedSale)).thenReturn(response);

            // Act
            saleService.create(request, user);

            // Assert
            ArgumentCaptor<Sale> saleCaptor = ArgumentCaptor.forClass(Sale.class);
            verify(saleRepository).save(saleCaptor.capture());
            assertThat(saleCaptor.getValue().getSalesConsultant()).isEqualTo(consultant);
        }

        @Test
        @DisplayName("Should use default status when not specified")
        void create_ShouldUseDefaultStatus_WhenNotSpecified() {
            // Arrange
            User user = createUser();
            Customer customer = createCustomer();

            SaleRequest request = new SaleRequest();
            request.setCustomerId(customer.getId());
            request.setStatus(null);

            Sale savedSale = createSale();
            SaleResponse response = createSaleResponse(savedSale);

            when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
            when(saleRepository.save(any(Sale.class))).thenReturn(savedSale);
            when(saleMapper.toResponse(savedSale)).thenReturn(response);

            // Act
            saleService.create(request, user);

            // Assert
            ArgumentCaptor<Sale> saleCaptor = ArgumentCaptor.forClass(Sale.class);
            verify(saleRepository).save(saleCaptor.capture());
            assertThat(saleCaptor.getValue().getStatus()).isEqualTo(SaleStatus.DEVAM_EDIYOR);
        }
    }

    // ========== GetById Tests ==========

    @Nested
    @DisplayName("getById() Tests")
    class GetByIdTests {

        @Test
        @DisplayName("Should return sale when exists")
        void getById_ShouldReturnSale_WhenExists() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            Sale sale = createSale();
            sale.setId(saleId);
            SaleResponse response = createSaleResponse(sale);

            when(saleRepository.findById(saleId)).thenReturn(Optional.of(sale));
            when(saleMapper.toResponse(sale)).thenReturn(response);

            // Act
            SaleResponse result = saleService.getById(saleId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(saleId);
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void getById_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            when(saleRepository.findById(saleId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saleService.getById(saleId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Sale not found");
        }
    }

    // ========== List Tests ==========

    @Nested
    @DisplayName("list() Tests")
    class ListTests {

        @Test
        @DisplayName("Should return filtered sales")
        void list_ShouldReturnFilteredSales() {
            // Arrange
            Sale sale = createSale();
            SaleResponse response = createSaleResponse(sale);

            when(saleRepository.findFiltered(null, null)).thenReturn(List.of(sale));
            when(saleMapper.toResponse(sale)).thenReturn(response);

            // Act
            List<SaleResponse> result = saleService.list(null, null);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should filter by status")
        void list_ShouldFilterByStatus() {
            // Arrange
            Sale sale = createSale();
            SaleResponse response = createSaleResponse(sale);

            when(saleRepository.findFiltered(SaleStatus.DEVAM_EDIYOR, null)).thenReturn(List.of(sale));
            when(saleMapper.toResponse(sale)).thenReturn(response);

            // Act
            List<SaleResponse> result = saleService.list(SaleStatus.DEVAM_EDIYOR, null);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should filter by consultant")
        void list_ShouldFilterByConsultant() {
            // Arrange
            UUID consultantId = UUID.randomUUID();
            Sale sale = createSale();
            SaleResponse response = createSaleResponse(sale);

            when(saleRepository.findFiltered(null, consultantId)).thenReturn(List.of(sale));
            when(saleMapper.toResponse(sale)).thenReturn(response);

            // Act
            List<SaleResponse> result = saleService.list(null, consultantId);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list when no matches")
        void list_ShouldReturnEmpty_WhenNoMatches() {
            // Arrange
            when(saleRepository.findFiltered(any(), any())).thenReturn(List.of());

            // Act
            List<SaleResponse> result = saleService.list(SaleStatus.TAMAMLANDI, null);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== UpdateStatus Tests ==========

    @Nested
    @DisplayName("updateStatus() Tests")
    class UpdateStatusTests {

        @Test
        @DisplayName("Should update status and log event")
        void updateStatus_ShouldUpdateStatusAndLogEvent() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            Sale sale = createSale();
            sale.setId(saleId);
            sale.setStatus(SaleStatus.DEVAM_EDIYOR);

            SaleResponse response = createSaleResponse(sale);

            when(saleRepository.findById(saleId)).thenReturn(Optional.of(sale));
            when(saleMapper.toResponse(sale)).thenReturn(response);

            // Act
            saleService.updateStatus(saleId, SaleStatus.TAMAMLANDI, user);

            // Assert
            assertThat(sale.getStatus()).isEqualTo(SaleStatus.TAMAMLANDI);
            verify(saleRepository).save(sale);
            verify(saleEventRepository).save(any(SaleEvent.class));
        }

        @Test
        @DisplayName("Should throw exception when sale not found")
        void updateStatus_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            when(saleRepository.findById(saleId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saleService.updateStatus(saleId, SaleStatus.TAMAMLANDI, user))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== UploadContract Tests ==========

    @Nested
    @DisplayName("uploadContract() Tests")
    class UploadContractTests {

        @Test
        @DisplayName("Should upload contract and log event")
        void uploadContract_ShouldUploadAndLogEvent() throws Exception {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            Sale sale = createSale();
            sale.setId(saleId);

            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("contract.pdf");

            SaleResponse response = createSaleResponse(sale);

            when(saleRepository.findById(saleId)).thenReturn(Optional.of(sale));
            when(storageService.store(file, "contracts/" + saleId)).thenReturn("contracts/file-key");
            when(saleMapper.toResponse(sale)).thenReturn(response);

            // Act
            SaleResponse result = saleService.uploadContract(saleId, file, user);

            // Assert
            assertThat(sale.getContractFileKey()).isEqualTo("contracts/file-key");
            verify(saleRepository).save(sale);
            verify(saleEventRepository).save(any(SaleEvent.class));
        }

        @Test
        @DisplayName("Should throw exception when sale not found")
        void uploadContract_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            MultipartFile file = mock(MultipartFile.class);

            when(saleRepository.findById(saleId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saleService.uploadContract(saleId, file, user))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when upload fails")
        void uploadContract_ShouldThrowException_WhenUploadFails() throws Exception {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            Sale sale = createSale();
            sale.setId(saleId);

            MultipartFile file = mock(MultipartFile.class);

            when(saleRepository.findById(saleId)).thenReturn(Optional.of(sale));
            when(storageService.store(any(), any())).thenThrow(new RuntimeException("Upload failed"));

            // Act & Assert
            assertThatThrownBy(() -> saleService.uploadContract(saleId, file, user))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Failed to upload file");
        }
    }

    // ========== DeleteContract Tests ==========

    @Nested
    @DisplayName("deleteContract() Tests")
    class DeleteContractTests {

        @Test
        @DisplayName("Should delete contract and log event")
        void deleteContract_ShouldDeleteAndLogEvent() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            Sale sale = createSale();
            sale.setId(saleId);
            sale.setContractFileKey("contracts/old-key");

            when(saleRepository.findById(saleId)).thenReturn(Optional.of(sale));

            // Act
            saleService.deleteContract(saleId, user);

            // Assert
            assertThat(sale.getContractFileKey()).isNull();
            verify(storageService).delete("contracts/old-key");
            verify(saleRepository).save(sale);
            verify(saleEventRepository).save(any(SaleEvent.class));
        }

        @Test
        @DisplayName("Should do nothing when no contract exists")
        void deleteContract_ShouldDoNothing_WhenNoContract() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            Sale sale = createSale();
            sale.setId(saleId);
            sale.setContractFileKey(null);

            when(saleRepository.findById(saleId)).thenReturn(Optional.of(sale));

            // Act
            saleService.deleteContract(saleId, user);

            // Assert
            verify(storageService, never()).delete(any());
            verify(saleRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when sale not found")
        void deleteContract_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            User user = createUser();
            when(saleRepository.findById(saleId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saleService.deleteContract(saleId, user))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== GetEvents Tests ==========

    @Nested
    @DisplayName("getEvents() Tests")
    class GetEventsTests {

        @Test
        @DisplayName("Should return sale events")
        void getEvents_ShouldReturnEvents() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            SaleEvent event = new SaleEvent();
            event.setEventType("CREATED");
            SaleEventResponse response = SaleEventResponse.builder()
                    .eventType("CREATED")
                    .build();

            when(saleEventRepository.findBySaleIdOrderByCreatedAtDesc(saleId)).thenReturn(List.of(event));
            when(saleEventMapper.toResponse(event)).thenReturn(response);

            // Act
            List<SaleEventResponse> result = saleService.getEvents(saleId);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getEventType()).isEqualTo("CREATED");
        }

        @Test
        @DisplayName("Should return empty list when no events")
        void getEvents_ShouldReturnEmpty_WhenNoEvents() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            when(saleEventRepository.findBySaleIdOrderByCreatedAtDesc(saleId)).thenReturn(List.of());

            // Act
            List<SaleEventResponse> result = saleService.getEvents(saleId);

            // Assert
            assertThat(result).isEmpty();
        }
    }
}
