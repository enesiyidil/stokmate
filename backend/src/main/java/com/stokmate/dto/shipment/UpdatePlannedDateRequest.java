package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlannedDateRequest {
    private String newDate; // ISO-8601 format datetime string
}
