package com.stokmate.service;

import com.stokmate.domain.Vehicle;
import com.stokmate.dto.vehicle.VehicleRequest;
import com.stokmate.dto.vehicle.VehicleResponse;
import com.stokmate.exception.ResourceNotFoundException;
import com.stokmate.mapper.VehicleMapper;
import com.stokmate.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAll() {
        return vehicleRepository.findAll().stream()
                .map(vehicleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse getById(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Araç bulunamadı: " + id));
        return vehicleMapper.toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        // Check if license plate already exists
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new IllegalArgumentException("Bu plaka zaten kayıtlı: " + request.getLicensePlate());
        }

        Vehicle vehicle = vehicleMapper.toEntity(request);
        Vehicle saved = vehicleRepository.save(vehicle);
        log.info("Vehicle created: {}", saved.getLicensePlate());
        return vehicleMapper.toResponse(saved);
    }

    @Transactional
    public VehicleResponse update(UUID id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Araç bulunamadı: " + id));

        // Check if license plate is being changed and if new plate already exists
        if (!vehicle.getLicensePlate().equals(request.getLicensePlate())) {
            if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
                throw new IllegalArgumentException("Bu plaka zaten kayıtlı: " + request.getLicensePlate());
            }
        }

        vehicleMapper.updateEntity(request, vehicle);
        Vehicle updated = vehicleRepository.save(vehicle);
        log.info("Vehicle updated: {}", updated.getLicensePlate());
        return vehicleMapper.toResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        if (!vehicleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Araç bulunamadı: " + id);
        }
        vehicleRepository.deleteById(id);
        log.info("Vehicle deleted: {}", id);
    }
}
