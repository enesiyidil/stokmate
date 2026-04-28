package com.stokmate.dto.crossconversion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrossConversionRequest {
    @NotNull
    private UUID customerId;

    @NotNull
    private UUID orderId;

    @NotBlank
    private String sourceBrand;

    @NotBlank
    private String targetBrand;

    private String notes;
}
