package com.stokmate.dto.orderreceipt;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class OrderReceiptCreateRequest {

    @NotNull(message = "Order product ID is required")
    private UUID orderProductId;

    @NotNull(message = "Received quantity is required")
    @Positive(message = "Received quantity must be positive")
    private BigDecimal receivedQuantity;

    private String notes;

    private String vehiclePlate;

    private String driverName;

    private String driverPhone;
}
