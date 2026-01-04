package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlannedShipmentRequest {
    private LocalDateTime plannedDate;
    private UUID vehicleId;
    private UUID driverId; // Optional - defaults to current user if not provided
}
