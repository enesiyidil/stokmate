package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.Vehicle;
import com.stokmate.dto.vehicle.VehicleRequest;
import com.stokmate.dto.vehicle.VehicleResponse;
import com.stokmate.exception.ResourceNotFoundException;
import com.stokmate.mapper.VehicleMapper;
import com.stokmate.repository.VehicleRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleMapper vehicleMapper;

    private VehicleService vehicleService;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleService(vehicleRepository, vehicleMapper);
    }

    // ========== Helper Methods ==========

    private Vehicle createVehicle() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setLicensePlate("34ABC123");
        vehicle.setVehicleType("Kamyonet");
        return vehicle;
    }

    private VehicleResponse createVehicleResponse(Vehicle vehicle) {
        return VehicleResponse.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .vehicleType(vehicle.getVehicleType())
                .build();
    }

    // ========== GetAll Tests ==========

    @Nested
    @DisplayName("getAll() Tests")
    class GetAllTests {

        @Test
        @DisplayName("Should return all vehicles")
        void getAll_ShouldReturnAllVehicles() {
            // Arrange
            Vehicle vehicle1 = createVehicle();
            Vehicle vehicle2 = createVehicle();
            vehicle2.setLicensePlate("34XYZ789");

            VehicleResponse response1 = createVehicleResponse(vehicle1);
            VehicleResponse response2 = createVehicleResponse(vehicle2);

            when(vehicleRepository.findAll()).thenReturn(List.of(vehicle1, vehicle2));
            when(vehicleMapper.toResponse(vehicle1)).thenReturn(response1);
            when(vehicleMapper.toResponse(vehicle2)).thenReturn(response2);

            // Act
            List<VehicleResponse> result = vehicleService.getAll();

            // Assert
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Should return empty list when no vehicles")
        void getAll_ShouldReturnEmpty_WhenNoVehicles() {
            // Arrange
            when(vehicleRepository.findAll()).thenReturn(List.of());

            // Act
            List<VehicleResponse> result = vehicleService.getAll();

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // ========== GetById Tests ==========

    @Nested
    @DisplayName("getById() Tests")
    class GetByIdTests {

        @Test
        @DisplayName("Should return vehicle when exists")
        void getById_ShouldReturnVehicle_WhenExists() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            Vehicle vehicle = createVehicle();
            vehicle.setId(vehicleId);
            VehicleResponse response = createVehicleResponse(vehicle);

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
            when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

            // Act
            VehicleResponse result = vehicleService.getById(vehicleId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(vehicleId);
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void getById_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vehicleService.getById(vehicleId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========== Create Tests ==========

    @Nested
    @DisplayName("create() Tests")
    class CreateTests {

        @Test
        @DisplayName("Should create vehicle successfully")
        void create_ShouldCreateVehicle_WhenPlateNotExists() {
            // Arrange
            VehicleRequest request = new VehicleRequest();
            request.setLicensePlate("34NEW001");
            request.setVehicleType("Kamyon");

            Vehicle vehicle = createVehicle();
            VehicleResponse response = createVehicleResponse(vehicle);

            when(vehicleRepository.existsByLicensePlate("34NEW001")).thenReturn(false);
            when(vehicleMapper.toEntity(request)).thenReturn(vehicle);
            when(vehicleRepository.save(vehicle)).thenReturn(vehicle);
            when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

            // Act
            VehicleResponse result = vehicleService.create(request);

            // Assert
            assertThat(result).isNotNull();
            verify(vehicleRepository).save(vehicle);
        }

        @Test
        @DisplayName("Should throw exception when license plate exists")
        void create_ShouldThrowException_WhenPlateExists() {
            // Arrange
            VehicleRequest request = new VehicleRequest();
            request.setLicensePlate("34EXISTING");

            when(vehicleRepository.existsByLicensePlate("34EXISTING")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> vehicleService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Bu plaka zaten kayıtlı");
        }
    }

    // ========== Update Tests ==========

    @Nested
    @DisplayName("update() Tests")
    class UpdateTests {

        @Test
        @DisplayName("Should update vehicle successfully")
        void update_ShouldUpdateVehicle_WhenExists() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            Vehicle vehicle = createVehicle();
            vehicle.setId(vehicleId);
            vehicle.setLicensePlate("34ABC123");

            VehicleRequest request = new VehicleRequest();
            request.setLicensePlate("34ABC123"); // Same plate
            request.setVehicleType("Panelvan");

            VehicleResponse response = createVehicleResponse(vehicle);

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
            when(vehicleRepository.save(vehicle)).thenReturn(vehicle);
            when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

            // Act
            VehicleResponse result = vehicleService.update(vehicleId, request);

            // Assert
            assertThat(result).isNotNull();
            verify(vehicleMapper).updateEntity(request, vehicle);
            verify(vehicleRepository).save(vehicle);
        }

        @Test
        @DisplayName("Should throw exception when vehicle not found")
        void update_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            VehicleRequest request = new VehicleRequest();

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vehicleService.update(vehicleId, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when changing to existing plate")
        void update_ShouldThrowException_WhenChangingToExistingPlate() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            Vehicle vehicle = createVehicle();
            vehicle.setId(vehicleId);
            vehicle.setLicensePlate("34ORIGINAL");

            VehicleRequest request = new VehicleRequest();
            request.setLicensePlate("34EXISTING");

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
            when(vehicleRepository.existsByLicensePlate("34EXISTING")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> vehicleService.update(vehicleId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Bu plaka zaten kayıtlı");
        }

        @Test
        @DisplayName("Should allow update with same license plate")
        void update_ShouldAllowSamePlate() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            Vehicle vehicle = createVehicle();
            vehicle.setId(vehicleId);
            vehicle.setLicensePlate("34SAME001");

            VehicleRequest request = new VehicleRequest();
            request.setLicensePlate("34SAME001"); // Same plate as existing
            request.setVehicleType("Kamyon");

            VehicleResponse response = createVehicleResponse(vehicle);

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
            when(vehicleRepository.save(vehicle)).thenReturn(vehicle);
            when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

            // Act
            VehicleResponse result = vehicleService.update(vehicleId, request);

            // Assert
            assertThat(result).isNotNull();
            verify(vehicleRepository, never()).existsByLicensePlate(any());
        }
    }

    // ========== Delete Tests ==========

    @Nested
    @DisplayName("delete() Tests")
    class DeleteTests {

        @Test
        @DisplayName("Should delete vehicle when exists")
        void delete_ShouldDeleteVehicle_WhenExists() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            when(vehicleRepository.existsById(vehicleId)).thenReturn(true);

            // Act
            vehicleService.delete(vehicleId);

            // Assert
            verify(vehicleRepository).deleteById(vehicleId);
        }

        @Test
        @DisplayName("Should throw exception when not found")
        void delete_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID vehicleId = UUID.randomUUID();
            when(vehicleRepository.existsById(vehicleId)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> vehicleService.delete(vehicleId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
