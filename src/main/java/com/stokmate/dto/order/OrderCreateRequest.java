package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.stokmate.dto.customer.CustomerRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.stokmate.domain.OrderStatus;

/**
 * Request DTO for creating an Order with products
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCreateRequest {

    @NotBlank(message = "Order number is required")
    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("prosapContractNo")
    private String prosapContractNo;

    @NotBlank(message = "Prosap contract name/surname is required")
    @JsonProperty("prosapContractNameSurname")
    private String prosapContractNameSurname;

    @NotNull(message = "Order date is required")
    @JsonProperty("orderDate")
    private LocalDate orderDate;

    @NotEmpty(message = "At least one product is required")
    @Valid
    @JsonProperty("products")
    private List<OrderProductCreateRequest> products;

    @JsonProperty("status")
    private OrderStatus status;

    @JsonProperty("orderType")
    private com.stokmate.domain.OrderType orderType;

    // Customer-specific order fields (both are optional)
    @JsonProperty("customerId")
    private UUID customerId; // Use existing customer

    @JsonProperty("customerData")
    @Valid
    private CustomerRequest customerData; // Create new customer

    // New fields for three-tier order system
    @JsonProperty("salesConsultantId")
    private UUID salesConsultantId; // For CUSTOMER_SPECIFIC orders

    @JsonProperty("sshServiceType")
    private com.stokmate.domain.SshServiceType sshServiceType; // For AFTER_SALES_SERVICE orders

    @JsonProperty("deliveryDestination")
    private com.stokmate.domain.DeliveryDestination deliveryDestination; // For AFTER_SALES_SERVICE orders

    @JsonProperty("partialShipmentEnabled")
    private Boolean partialShipmentEnabled;

    @JsonProperty("parentOrderId")
    private UUID parentOrderId; // For SSH sub-orders

    @JsonProperty("orderNotes")
    private String orderNotes;
}
