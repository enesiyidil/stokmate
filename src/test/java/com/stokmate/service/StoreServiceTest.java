package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Store;
import com.stokmate.domain.User;
import com.stokmate.domain.Role;
import com.stokmate.dto.store.StoreCreateRequest;
import com.stokmate.dto.store.StoreResponse;
import com.stokmate.dto.store.StoreUpdateRequest;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.StoreMapper;
import com.stokmate.repository.StoreRepository;
import com.stokmate.repository.UserRepository;

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
class StoreServiceTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StoreMapper storeMapper;

    private StoreService storeService;

    @BeforeEach
    void setUp() {
        storeService = new StoreService(storeRepository, userRepository, storeMapper);
    }

    // ========== Helper Methods ==========

    private Store createStore() {
        Store store = new Store();
        store.setId("STORE001");
        store.setCode("ST001");
        store.setName("Test Store");
        store.setAddress("Test Address");
        store.setPhone("1234567890");
        store.setEmail("store@example.com");
        store.setActive(true);
        return store;
    }

    private User createManager() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("manager@example.com");
        user.setFirstName("Manager");
        user.setLastName("User");
        user.setRole(Role.STORE_MANAGER);
        return user;
    }

    private StoreResponse createStoreResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .code(store.getCode())
                .name(store.getName())
                .address(store.getAddress())
                .phone(store.getPhone())
                .email(store.getEmail())
                .active(store.isActive())
                .build();
    }

    // ========== CreateStore Tests ==========

    @Nested
    @DisplayName("createStore() Tests")
    class CreateStoreTests {

        @Test
        @DisplayName("Should create store successfully")
        void createStore_ShouldCreateStore_WhenCodeNotExists() {
            // Arrange
            StoreCreateRequest request = new StoreCreateRequest();
            request.setCode("NEW001");
            request.setName("New Store");
            request.setAddress("New Address");
            request.setPhone("1234567890");
            request.setEmail("new@store.com");

            Store savedStore = createStore();
            savedStore.setCode("NEW001");
            StoreResponse response = createStoreResponse(savedStore);

            when(storeRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(storeRepository.save(any(Store.class))).thenReturn(savedStore);
            when(storeMapper.toResponse(savedStore)).thenReturn(response);

            // Act
            StoreResponse result = storeService.createStore(request);

            // Assert
            assertThat(result.getCode()).isEqualTo("NEW001");
            verify(storeRepository).save(any(Store.class));
        }

        @Test
        @DisplayName("Should throw exception when code already exists")
        void createStore_ShouldThrowException_WhenCodeExists() {
            // Arrange
            StoreCreateRequest request = new StoreCreateRequest();
            request.setCode("EXISTING");

            when(storeRepository.findByCode("EXISTING")).thenReturn(Optional.of(createStore()));

            // Act & Assert
            assertThatThrownBy(() -> storeService.createStore(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Store code already exists");
        }

        @Test
        @DisplayName("Should assign manager when managerId provided")
        void createStore_ShouldAssignManager_WhenManagerIdProvided() {
            // Arrange
            UUID managerId = UUID.randomUUID();
            User manager = createManager();
            manager.setId(managerId);

            StoreCreateRequest request = new StoreCreateRequest();
            request.setCode("NEW001");
            request.setName("New Store");
            request.setManagerId(managerId.toString());

            Store savedStore = createStore();
            savedStore.setManager(manager);
            StoreResponse response = createStoreResponse(savedStore);

            when(storeRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(userRepository.findById(managerId)).thenReturn(Optional.of(manager));
            when(storeRepository.save(any(Store.class))).thenReturn(savedStore);
            when(storeMapper.toResponse(savedStore)).thenReturn(response);

            // Act
            storeService.createStore(request);

            // Assert
            ArgumentCaptor<Store> storeCaptor = ArgumentCaptor.forClass(Store.class);
            verify(storeRepository).save(storeCaptor.capture());
            assertThat(storeCaptor.getValue().getManager()).isEqualTo(manager);
        }

        @Test
        @DisplayName("Should throw exception when manager not found")
        void createStore_ShouldThrowException_WhenManagerNotFound() {
            // Arrange
            UUID managerId = UUID.randomUUID();
            StoreCreateRequest request = new StoreCreateRequest();
            request.setCode("NEW001");
            request.setName("New Store");
            request.setManagerId(managerId.toString());

            when(storeRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(userRepository.findById(managerId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeService.createStore(request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Manager not found");
        }

        @Test
        @DisplayName("Should create store without manager")
        void createStore_ShouldCreateStore_WithoutManager() {
            // Arrange
            StoreCreateRequest request = new StoreCreateRequest();
            request.setCode("NEW001");
            request.setName("New Store");
            request.setManagerId(null);

            Store savedStore = createStore();
            StoreResponse response = createStoreResponse(savedStore);

            when(storeRepository.findByCode("NEW001")).thenReturn(Optional.empty());
            when(storeRepository.save(any(Store.class))).thenReturn(savedStore);
            when(storeMapper.toResponse(savedStore)).thenReturn(response);

            // Act
            StoreResponse result = storeService.createStore(request);

            // Assert
            verify(userRepository, never()).findById(any());
        }
    }

    // ========== UpdateStore Tests ==========

    @Nested
    @DisplayName("updateStore() Tests")
    class UpdateStoreTests {

        @Test
        @DisplayName("Should update store fields")
        void updateStore_ShouldUpdateFields() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setName("Updated Name");
            request.setAddress("Updated Address");
            request.setPhone("9876543210");
            request.setEmail("updated@store.com");

            Store updatedStore = createStore();
            updatedStore.setName("Updated Name");
            StoreResponse response = createStoreResponse(updatedStore);

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(storeRepository.save(any(Store.class))).thenReturn(updatedStore);
            when(storeMapper.toResponse(updatedStore)).thenReturn(response);

            // Act
            StoreResponse result = storeService.updateStore(storeId, request);

            // Assert
            verify(storeRepository).save(store);
            assertThat(store.getName()).isEqualTo("Updated Name");
        }

        @Test
        @DisplayName("Should throw exception when store not found")
        void updateStore_ShouldThrowException_WhenNotFound() {
            // Arrange
            when(storeRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeService.updateStore("UNKNOWN", new StoreUpdateRequest()))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Store not found");
        }

        @Test
        @DisplayName("Should handle empty strings as null")
        void updateStore_ShouldSetNullForEmptyStrings() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            store.setAddress("Original Address");
            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setAddress("   "); // Empty after trim

            Store updatedStore = createStore();
            StoreResponse response = createStoreResponse(updatedStore);

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(storeRepository.save(any(Store.class))).thenReturn(updatedStore);
            when(storeMapper.toResponse(updatedStore)).thenReturn(response);

            // Act
            storeService.updateStore(storeId, request);

            // Assert
            assertThat(store.getAddress()).isNull();
        }

        @Test
        @DisplayName("Should update manager")
        void updateStore_ShouldUpdateManager() {
            // Arrange
            String storeId = "STORE001";
            UUID managerId = UUID.randomUUID();
            Store store = createStore();
            User newManager = createManager();
            newManager.setId(managerId);

            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setManagerId(managerId.toString());

            Store updatedStore = createStore();
            StoreResponse response = createStoreResponse(updatedStore);

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(userRepository.findById(managerId)).thenReturn(Optional.of(newManager));
            when(storeRepository.save(any(Store.class))).thenReturn(updatedStore);
            when(storeMapper.toResponse(updatedStore)).thenReturn(response);

            // Act
            storeService.updateStore(storeId, request);

            // Assert
            assertThat(store.getManager()).isEqualTo(newManager);
        }

        @Test
        @DisplayName("Should update active status")
        void updateStore_ShouldUpdateActiveStatus() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            store.setActive(true);

            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setActive(false);

            Store updatedStore = createStore();
            StoreResponse response = createStoreResponse(updatedStore);

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(storeRepository.save(any(Store.class))).thenReturn(updatedStore);
            when(storeMapper.toResponse(updatedStore)).thenReturn(response);

            // Act
            storeService.updateStore(storeId, request);

            // Assert
            assertThat(store.isActive()).isFalse();
        }
    }

    // ========== GetStoreById Tests ==========

    @Nested
    @DisplayName("getStoreById() Tests")
    class GetStoreByIdTests {

        @Test
        @DisplayName("Should return store when exists")
        void getStoreById_ShouldReturnStore_WhenExists() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            StoreResponse response = createStoreResponse(store);

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(storeMapper.toResponse(store)).thenReturn(response);

            // Act
            StoreResponse result = storeService.getStoreById(storeId);

            // Assert
            assertThat(result.getId()).isEqualTo("STORE001");
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void getStoreById_ShouldThrowException_WhenNotFound() {
            // Arrange
            when(storeRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeService.getStoreById("UNKNOWN"))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== ListAllStores Tests ==========

    @Nested
    @DisplayName("listAllStores() Tests")
    class ListAllStoresTests {

        @Test
        @DisplayName("Should return all stores")
        void listAllStores_ShouldReturnAllStores() {
            // Arrange
            Store store1 = createStore();
            Store store2 = createStore();
            store2.setId("STORE002");

            StoreResponse response1 = createStoreResponse(store1);
            StoreResponse response2 = createStoreResponse(store2);

            when(storeRepository.findAll()).thenReturn(List.of(store1, store2));
            when(storeMapper.toResponse(store1)).thenReturn(response1);
            when(storeMapper.toResponse(store2)).thenReturn(response2);

            // Act
            List<StoreResponse> result = storeService.listAllStores();

            // Assert
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Should return empty list when no stores")
        void listAllStores_ShouldReturnEmpty_WhenNoStores() {
            // Arrange
            when(storeRepository.findAll()).thenReturn(List.of());

            // Act
            List<StoreResponse> result = storeService.listAllStores();

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== ListActiveStores Tests ==========

    @Nested
    @DisplayName("listActiveStores() Tests")
    class ListActiveStoresTests {

        @Test
        @DisplayName("Should return only active stores")
        void listActiveStores_ShouldReturnActiveStores() {
            // Arrange
            Store activeStore = createStore();
            activeStore.setActive(true);
            StoreResponse response = createStoreResponse(activeStore);

            when(storeRepository.findByActive(true)).thenReturn(List.of(activeStore));
            when(storeMapper.toResponse(activeStore)).thenReturn(response);

            // Act
            List<StoreResponse> result = storeService.listActiveStores();

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).isActive()).isTrue();
        }
    }

    // ========== DeleteStore Tests ==========

    @Nested
    @DisplayName("deleteStore() Tests")
    class DeleteStoreTests {

        @Test
        @DisplayName("Should soft delete store")
        void deleteStore_ShouldSetActiveToFalse() {
            // Arrange
            String storeId = "STORE001";
            Store store = createStore();
            store.setActive(true);

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

            // Act
            storeService.deleteStore(storeId);

            // Assert
            assertThat(store.isActive()).isFalse();
            verify(storeRepository).save(store);
        }

        @Test
        @DisplayName("Should throw exception when store not found")
        void deleteStore_ShouldThrowException_WhenNotFound() {
            // Arrange
            when(storeRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> storeService.deleteStore("UNKNOWN"))
                    .isInstanceOf(NotFoundException.class);
        }
    }
}
