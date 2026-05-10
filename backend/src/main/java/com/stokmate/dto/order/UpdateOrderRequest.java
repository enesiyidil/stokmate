package com.stokmate.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderRequest {

    @NotBlank(message = "Order number is required")
    private String orderNo;

    private String prosapContractNo;

    @NotBlank(message = "Contract name/surname is required")
    private String prosapContractNameSurname;

    @NotNull(message = "Order date is required")
    private LocalDate orderDate;

    // Optional: update customer or sales consultant
    private UUID customerId;
    private UUID salesConsultantId;

    // Notes
    private String orderNotes;
    private String shipmentNote;
}
