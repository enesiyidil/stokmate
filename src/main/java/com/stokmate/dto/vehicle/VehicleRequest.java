package com.stokmate.dto.vehicle;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "Araç plakası zorunludur")
    private String licensePlate;

    @NotBlank(message = "Araç tipi zorunludur")
    private String vehicleType;
}
