package com.stokmate.dto.report;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateShipmentReportRequest {

    @NotNull(message = "Başlangıç tarihi gereklidir")
    private LocalDate startDate;

    @NotNull(message = "Bitiş tarihi gereklidir")
    private LocalDate endDate;

    private String shipmentScope; // ORDER, SALE, ALL (default ALL)

    private String title; // Optional custom title
}
