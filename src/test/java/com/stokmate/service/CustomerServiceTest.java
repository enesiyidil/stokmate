package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Customer;
import com.stokmate.dto.customer.CustomerRequest;
import com.stokmate.dto.customer.CustomerResponse;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.CustomerMapper;
import com.stokmate.repository.CustomerRepository;

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

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerMapper customerMapper;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(customerRepository, customerMapper);
    }

    // ========== Helper Methods ==========

    private Customer createCustomer() {
        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setEmail("john.doe@example.com");
        customer.setPhone("1234567890");
        customer.setTcNo("12345678901");
        customer.setCity("Istanbul");
        customer.setDistrict("Kadikoy");
        customer.setNeighborhood("Moda");
        customer.setFullAddress("Test Address 123");
        customer.setIsDeleted(false);
        return customer;
    }

    private CustomerResponse createCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .firstName(customer.getFirstName())
                .lastName(customer.getLastName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .build();
    }

    // ========== Create Tests ==========

    @Nested
    @DisplayName("create() Tests")
    class CreateTests {

        @Test
        @DisplayName("Should create customer successfully")
        void create_ShouldCreateCustomer() {
            // Arrange
            CustomerRequest request = new CustomerRequest();
            request.setFirstName("Jane");
            request.setLastName("Doe");

            Customer customer = createCustomer();
            CustomerResponse response = createCustomerResponse(customer);

            when(customerMapper.toEntity(request)).thenReturn(customer);
            when(customerRepository.save(customer)).thenReturn(customer);
            when(customerMapper.toResponse(customer)).thenReturn(response);

            // Act
            CustomerResponse result = customerService.create(request);

            // Assert
            assertThat(result).isNotNull();
            verify(customerRepository).save(customer);
        }
    }

    // ========== Update Tests ==========

    @Nested
    @DisplayName("update() Tests")
    class UpdateTests {

        @Test
        @DisplayName("Should update customer successfully")
        void update_ShouldUpdateCustomer_WhenExists() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            Customer customer = createCustomer();
            customer.setId(customerId);

            CustomerRequest request = new CustomerRequest();
            request.setFirstName("Updated");
            request.setLastName("Name");

            CustomerResponse response = createCustomerResponse(customer);

            when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
            when(customerRepository.save(customer)).thenReturn(customer);
            when(customerMapper.toResponse(customer)).thenReturn(response);

            // Act
            CustomerResponse result = customerService.update(customerId, request);

            // Assert
            verify(customerMapper).update(customer, request);
            verify(customerRepository).save(customer);
        }

        @Test
        @DisplayName("Should throw exception when customer not found")
        void update_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            CustomerRequest request = new CustomerRequest();

            when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> customerService.update(customerId, request))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== Delete Tests ==========

    @Nested
    @DisplayName("delete() Tests")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete and anonymize customer data")
        void delete_ShouldAnonymizeData() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            Customer customer = createCustomer();
            customer.setId(customerId);

            when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));

            // Act
            customerService.delete(customerId);

            // Assert
            ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
            verify(customerRepository).save(captor.capture());

            Customer savedCustomer = captor.getValue();
            assertThat(savedCustomer.getIsDeleted()).isTrue();
            assertThat(savedCustomer.getFirstName()).isEqualTo("Müşteri");
            assertThat(savedCustomer.getLastName()).isEmpty();
            assertThat(savedCustomer.getPhone()).isNull();
            assertThat(savedCustomer.getEmail()).isNull();
            assertThat(savedCustomer.getTcNo()).isNull();
            assertThat(savedCustomer.getCity()).isNull();
            assertThat(savedCustomer.getDistrict()).isNull();
            assertThat(savedCustomer.getNeighborhood()).isNull();
            assertThat(savedCustomer.getFullAddress()).isNull();
        }

        @Test
        @DisplayName("Should throw exception when customer not found")
        void delete_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> customerService.delete(customerId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== Get Tests ==========

    @Nested
    @DisplayName("get() Tests")
    class GetTests {

        @Test
        @DisplayName("Should return customer when exists")
        void get_ShouldReturnCustomer_WhenExists() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            Customer customer = createCustomer();
            CustomerResponse response = createCustomerResponse(customer);

            when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
            when(customerMapper.toResponse(customer)).thenReturn(response);

            // Act
            CustomerResponse result = customerService.get(customerId);

            // Assert
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void get_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> customerService.get(customerId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== List Tests ==========

    @Nested
    @DisplayName("list() Tests")
    class ListTests {

        @Test
        @DisplayName("Should return paginated list excluding deleted")
        void list_ShouldReturnPaginatedList() {
            // Arrange
            Pageable pageable = Pageable.unpaged();
            Customer customer = createCustomer();
            CustomerResponse response = createCustomerResponse(customer);
            Page<Customer> customerPage = new PageImpl<>(List.of(customer));

            when(customerRepository.findByIsDeleted(false, pageable)).thenReturn(customerPage);
            when(customerMapper.toResponse(customer)).thenReturn(response);

            // Act
            Page<CustomerResponse> result = customerService.list(pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty page when no customers")
        void list_ShouldReturnEmptyPage_WhenNoCustomers() {
            // Arrange
            Pageable pageable = Pageable.unpaged();
            Page<Customer> emptyPage = Page.empty();

            when(customerRepository.findByIsDeleted(false, pageable)).thenReturn(emptyPage);

            // Act
            Page<CustomerResponse> result = customerService.list(pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
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
            UUID customerId = UUID.randomUUID();
            Customer customer = createCustomer();

            when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));

            // Act
            Customer result = customerService.getEntity(customerId);

            // Assert
            assertThat(result).isEqualTo(customer);
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void getEntity_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> customerService.getEntity(customerId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Customer not found");
        }
    }

    // ========== SearchByName Tests ==========

    @Nested
    @DisplayName("searchByName() Tests")
    class SearchByNameTests {

        @Test
        @DisplayName("Should return matching customers")
        void searchByName_ShouldReturnMatchingCustomers() {
            // Arrange
            Customer customer1 = createCustomer();
            customer1.setFirstName("John");
            customer1.setLastName("Doe");
            customer1.setIsDeleted(false);

            Customer customer2 = createCustomer();
            customer2.setFirstName("Jane");
            customer2.setLastName("Smith");
            customer2.setIsDeleted(false);

            CustomerResponse response1 = createCustomerResponse(customer1);

            when(customerRepository.findAll()).thenReturn(List.of(customer1, customer2));
            when(customerMapper.toResponse(customer1)).thenReturn(response1);

            // Act
            List<CustomerResponse> result = customerService.searchByName("John");

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list for null query")
        void searchByName_ShouldReturnEmpty_WhenQueryIsNull() {
            // Act
            List<CustomerResponse> result = customerService.searchByName(null);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for empty query")
        void searchByName_ShouldReturnEmpty_WhenQueryIsEmpty() {
            // Act
            List<CustomerResponse> result = customerService.searchByName("   ");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should exclude deleted customers")
        void searchByName_ShouldExcludeDeleted() {
            // Arrange
            Customer activeCustomer = createCustomer();
            activeCustomer.setFirstName("John");
            activeCustomer.setIsDeleted(false);

            Customer deletedCustomer = createCustomer();
            deletedCustomer.setFirstName("John");
            deletedCustomer.setIsDeleted(true);

            CustomerResponse response = createCustomerResponse(activeCustomer);

            when(customerRepository.findAll()).thenReturn(List.of(activeCustomer, deletedCustomer));
            when(customerMapper.toResponse(activeCustomer)).thenReturn(response);

            // Act
            List<CustomerResponse> result = customerService.searchByName("John");

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should search case-insensitively")
        void searchByName_ShouldBeCaseInsensitive() {
            // Arrange
            Customer customer = createCustomer();
            customer.setFirstName("JOHN");
            customer.setLastName("DOE");
            customer.setIsDeleted(false);

            CustomerResponse response = createCustomerResponse(customer);

            when(customerRepository.findAll()).thenReturn(List.of(customer));
            when(customerMapper.toResponse(customer)).thenReturn(response);

            // Act
            List<CustomerResponse> result = customerService.searchByName("john doe");

            // Assert
            assertThat(result).hasSize(1);
        }
    }
}
