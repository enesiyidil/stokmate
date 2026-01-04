package com.stokmate.controller;

import com.stokmate.dto.vehicle.VehicleRequest;
import com.stokmate.dto.vehicle.VehicleResponse;
import com.stokmate.service.VehicleService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU','DEPO_CALISAN')")
    @GetMapping
    public List<VehicleResponse> getAll() {
        return vehicleService.getAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU','DEPO_CALISAN')")
    @GetMapping("/{id}")
    public VehicleResponse getById(@PathVariable("id") UUID id) {
        return vehicleService.getById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU')")
    @PostMapping
    public VehicleResponse create(@Valid @RequestBody VehicleRequest request) {
        return vehicleService.create(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUDUR','DEPO_SORUMLU')")
    @PutMapping("/{id}")
    public VehicleResponse update(@PathVariable("id") UUID id, @Valid @RequestBody VehicleRequest request) {
        return vehicleService.update(id, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") UUID id) {
        vehicleService.delete(id);
    }
}
