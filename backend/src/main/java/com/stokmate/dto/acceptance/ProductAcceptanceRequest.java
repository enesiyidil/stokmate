package com.stokmate.dto.acceptance;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductAcceptanceRequest {

    @NotNull(message = "Order product ID is required")
    private String orderProductId;

    @NotNull(message = "Accepted quantity is required")
    @DecimalMin(value = "0.01", message = "Accepted quantity must be greater than 0")
    private BigDecimal acceptedQuantity;

    @NotBlank(message = "Note is required")
    private String note;

    @NotBlank(message = "Vehicle plate is required")
    private String vehiclePlate;

    @NotBlank(message = "Driver info is required")
    private String driverInfo;
}
