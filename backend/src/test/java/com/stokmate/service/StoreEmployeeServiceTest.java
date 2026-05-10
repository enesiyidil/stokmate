package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Role;
import com.stokmate.domain.Store;
import com.stokmate.domain.StoreEmployee;
import com.stokmate.domain.User;
import com.stokmate.dto.store.StoreEmployeeRequest;
import com.stokmate.dto.store.StoreEmployeeResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.StoreEmployeeMapper;
import com.stokmate.repository.StoreEmployeeRepository;
import com.stokmate.repository.StoreRepository;
import com.stokmate.repository.UserRepository;

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

@ExtendWith(MockitoExtension.class)
class StoreEmployeeServiceTest {

    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StoreEmployeeMapper storeEmployeeMapper;

    private StoreEmployeeService storeEmployeeService;

    @BeforeEach
    void setUp() {
        storeEmployeeService = new StoreEmployeeService(
                storeEmployeeRepository,
                storeRepository,
                userRepository,
                storeEmployeeMapper);
    }

    // ========== Helper Methods ==========

    private Store createStore() {
        Store store = new Store();
        store.setId("STORE001");
        store.setName("Test Store");
        store.setActive(true);
        return store;
    }

    private User createUser(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("employee@example.com");
        user.setFirstName("Test");
        user.setLastName("Employee");
        user.setRole(role);
        return user;
    }

    private StoreEmployee createStoreEmployee(Store store, User user) {
        StoreEmployee se = new StoreEmployee();
        se.setId(UUID.randomUUID().toString());
        se.setStore(store);
        se.setUser(user);
        se.setJoinDate(LocalDate.now());
        se.setActive(true);
        return se;
    }

    // ========== AssignEmployeeToStore Tests ==========

    @Nested
    @DisplayName("assignEmployeeToStore() Tests")
    class AssignEmployeeToStoreTests {

        @Test
        @DisplayName("Should assign employee successfully")
        void assignEmployeeToStore_ShouldAssignEmployee() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            User user = createUser(Role.STORE_EMPLOYEE);

            StoreEmployeeRequest request = new StoreEmployeeRequest();
            request.setUserId(user.getId().toString());
            request.setJoinDate(LocalDate.now());

            StoreEmployee savedEmployee = createStoreEmployee(store, user);
            StoreEmployeeResponse response = StoreEmployeeResponse.builder()
                    .id(savedEmployee.getId())
                    .active(true)
                    .build();

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
            when(storeEmployeeRepository.findByUserIdAndActive(user.getId(), true))
                    .thenReturn(Optional.empty());
            when(storeEmployeeRepository.save(any(StoreEmployee.class))).thenReturn(savedEmployee);
            when(storeEmployeeMapper.toResponse(savedEmployee)).thenReturn(response);

            // Act
            StoreEmployeeResponse result = storeEmployeeService.assignEmployeeToStore(storeId, request);

            // Assert
            assertThat(result).isNotNull();
            verify(storeEmployeeRepository).save(any(StoreEmployee.class));
        }

        @Test
        @DisplayName("Should deactivate existing assignment before new assignment")
        void assignEmployeeToStore_ShouldDeactivateExistingAssignment() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            User user = createUser(Role.STORE_MANAGER);

            StoreEmployeeRequest request = new StoreEmployeeRequest();
            request.setUserId(user.getId().toString());
            request.setJoinDate(LocalDate.now());

            StoreEmployee existingAssignment = createStoreEmployee(store, user);
            StoreEmployee newAssignment = createStoreEmployee(store, user);
            StoreEmployeeResponse response = StoreEmployeeResponse.builder().build();

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
            when(storeEmployeeRepository.findByUserIdAndActive(user.getId(), true))
                    .thenReturn(Optional.of(existingAssignment));
            when(storeEmployeeRepository.save(any(StoreEmployee.class))).thenReturn(newAssignment);
            when(storeEmployeeMapper.toResponse(any())).thenReturn(response);

            // Act
            storeEmployeeService.assignEmployeeToStore(storeId, request);

            // Assert
            assertThat(existingAssignment.isActive()).isFalse();
            verify(storeEmployeeRepository, times(2)).save(any(StoreEmployee.class));
        }

        @Test
        @DisplayName("Should throw exception when store not found")
        void assignEmployeeToStore_ShouldThrowException_WhenStoreNotFound() {
            // Arrange
            String storeId = "UNKNOWN";
            StoreEmployeeRequest request = new StoreEmployeeRequest();
            request.setUserId(UUID.randomUUID().toString());

            when(storeRepository.findById(storeId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeEmployeeService.assignEmployeeToStore(storeId, request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Store not found");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void assignEmployeeToStore_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            UUID userId = UUID.randomUUID();

            StoreEmployeeRequest request = new StoreEmployeeRequest();
            request.setUserId(userId.toString());

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeEmployeeService.assignEmployeeToStore(storeId, request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Should throw exception when user has invalid role")
        void assignEmployeeToStore_ShouldThrowException_WhenInvalidRole() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            User user = createUser(Role.ADMIN); // Invalid role

            StoreEmployeeRequest request = new StoreEmployeeRequest();
            request.setUserId(user.getId().toString());

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> storeEmployeeService.assignEmployeeToStore(storeId, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only store employees can be assigned");
        }
    }

    // ========== RemoveEmployeeFromStore Tests ==========

    @Nested
    @DisplayName("removeEmployeeFromStore() Tests")
    class RemoveEmployeeFromStoreTests {

        @Test
        @DisplayName("Should remove employee successfully")
        void removeEmployeeFromStore_ShouldRemoveEmployee() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            User user = createUser(Role.STORE_EMPLOYEE);
            StoreEmployee assignment = createStoreEmployee(store, user);
            assignment.getStore().setId(storeId);

            when(storeEmployeeRepository.findByUserIdAndActive(user.getId(), true))
                    .thenReturn(Optional.of(assignment));

            // Act
            storeEmployeeService.removeEmployeeFromStore(storeId, user.getId().toString());

            // Assert
            assertThat(assignment.isActive()).isFalse();
            verify(storeEmployeeRepository).save(assignment);
        }

        @Test
        @DisplayName("Should throw exception when no active assignment")
        void removeEmployeeFromStore_ShouldThrowException_WhenNoActiveAssignment() {
            // Arrange
            String storeId = "STORE001";
            UUID userId = UUID.randomUUID();

            when(storeEmployeeRepository.findByUserIdAndActive(userId, true))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeEmployeeService.removeEmployeeFromStore(storeId, userId.toString()))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Active assignment not found");
        }

        @Test
        @DisplayName("Should throw exception when assigned to different store")
        void removeEmployeeFromStore_ShouldThrowException_WhenDifferentStore() {
            // Arrange
            String storeId = "STORE001";
            Store differentStore = createStore();
            differentStore.setId("STORE002");
            User user = createUser(Role.STORE_EMPLOYEE);
            StoreEmployee assignment = createStoreEmployee(differentStore, user);

            when(storeEmployeeRepository.findByUserIdAndActive(user.getId(), true))
                    .thenReturn(Optional.of(assignment));

            // Act & Assert
            assertThatThrownBy(() -> storeEmployeeService.removeEmployeeFromStore(storeId, user.getId().toString()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User is not assigned to this store");
        }
    }

    // ========== GetStoreEmployees Tests ==========

    @Nested
    @DisplayName("getStoreEmployees() Tests")
    class GetStoreEmployeesTests {

        @Test
        @DisplayName("Should return store employees")
        void getStoreEmployees_ShouldReturnEmployees() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            User user = createUser(Role.STORE_EMPLOYEE);
            StoreEmployee employee = createStoreEmployee(store, user);
            StoreEmployeeResponse response = StoreEmployeeResponse.builder()
                    .id(employee.getId())
                    .active(true)
                    .build();

            when(storeEmployeeRepository.findByStoreIdAndActiveOrderByJoinDateDesc(storeId, true))
                    .thenReturn(List.of(employee));
            when(storeEmployeeMapper.toResponse(employee)).thenReturn(response);

            // Act
            List<StoreEmployeeResponse> result = storeEmployeeService.getStoreEmployees(storeId);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list when no employees")
        void getStoreEmployees_ShouldReturnEmpty_WhenNoEmployees() {
            // Arrange
            String storeId = "STORE001";

            when(storeEmployeeRepository.findByStoreIdAndActiveOrderByJoinDateDesc(storeId, true))
                    .thenReturn(List.of());

            // Act
            List<StoreEmployeeResponse> result = storeEmployeeService.getStoreEmployees(storeId);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== GetUserCurrentStore Tests ==========

    @Nested
    @DisplayName("getUserCurrentStore() Tests")
    class GetUserCurrentStoreTests {

        @Test
        @DisplayName("Should return current store when assigned")
        void getUserCurrentStore_ShouldReturnStore_WhenAssigned() {
            // Arrange
            UUID userId = UUID.randomUUID();
            Store store = createStore();
            User user = createUser(Role.STORE_EMPLOYEE);
            user.setId(userId);
            StoreEmployee assignment = createStoreEmployee(store, user);
            StoreEmployeeResponse response = StoreEmployeeResponse.builder()
                    .id(assignment.getId())
                    .active(true)
                    .build();

            when(storeEmployeeRepository.findByUserIdAndActive(userId, true))
                    .thenReturn(Optional.of(assignment));
            when(storeEmployeeMapper.toResponse(assignment)).thenReturn(response);

            // Act
            Optional<StoreEmployeeResponse> result = storeEmployeeService.getUserCurrentStore(userId);

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().getId()).isEqualTo(assignment.getId());
        }

        @Test
        @DisplayName("Should return empty when not assigned")
        void getUserCurrentStore_ShouldReturnEmpty_WhenNotAssigned() {
            // Arrange
            UUID userId = UUID.randomUUID();

            when(storeEmployeeRepository.findByUserIdAndActive(userId, true))
                    .thenReturn(Optional.empty());

            // Act
            Optional<StoreEmployeeResponse> result = storeEmployeeService.getUserCurrentStore(userId);

            // Assert
            assertThat(result).isEmpty();
        }
    }
}
