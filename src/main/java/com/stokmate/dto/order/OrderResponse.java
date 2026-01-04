package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.stokmate.domain.DeliveryDestination;
import com.stokmate.domain.OrderStatus;
import com.stokmate.domain.SshServiceType;
import com.stokmate.dto.customer.CustomerResponse;
import com.stokmate.dto.user.UserBasicResponse;
import com.stokmate.dto.user.UserResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private UUID id;

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("prosapContractNo")
    private String prosapContractNo;

    @JsonProperty("prosapContractNameSurname")
    private String prosapContractNameSurname;

    @JsonProperty("orderDate")
    private LocalDate orderDate;

    private List<OrderProductResponse> products;

    private OrderStatus status;

    private com.stokmate.domain.OrderType orderType;

    private boolean productsAccepted;

    @JsonProperty("invoiceFileKey")
    private String invoiceFileKey;

    @JsonProperty("hasInvoice")
    private boolean hasInvoice;

    private Instant createdAt;

    private Instant updatedAt;

    private CustomerResponse customer;

    // New fields for three-tier order system
    private UserResponse salesConsultant;

    private SshServiceType sshServiceType;

    private DeliveryDestination deliveryDestination;

    private Boolean partialShipmentEnabled;

    private UUID parentOrderId;

    private String orderNotes;

    // Partial delivery tracking fields (ORDER level)
    private Boolean partialDeliveryMarked;
    private String deliveryNotes;
    private UserBasicResponse deliveryLastUpdatedBy;
    private java.time.LocalDateTime deliveryLastUpdatedAt;
}
