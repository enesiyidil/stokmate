package com.stokmate.dto.report;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateOrderReportRequest {

    @NotNull(message = "Başlangıç tarihi gereklidir")
    private LocalDate startDate;

    @NotNull(message = "Bitiş tarihi gereklidir")
    private LocalDate endDate;

    private List<UUID> salesConsultantIds; // Optional, null = all

    private List<String> brands; // Optional, null = all (OAK, PINE, MAPLE)

    private String title; // Optional custom title
}
