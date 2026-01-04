package com.stokmate.dto.orderreceipt;

import com.stokmate.domain.OrderReceiptStatus;
import com.stokmate.dto.user.UserResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReceiptResponse {

    private UUID id;
    private UUID orderProductId;
    private UUID productId;
    private String orderNo;
    private String productCode;
    private String productName;
    private BigDecimal receivedQuantity;
    private String notes;
    private String vehiclePlate;
    private String driverName;
    private String driverPhone;
    private OrderReceiptStatus status;
    private UserResponse receivedBy;
    private UserResponse approvedBy;
    private Instant approvedAt;
    private String approvalNotes;
    private Instant createdAt;
    private Instant updatedAt;
    private List<OrderReceiptPhotoResponse> photos;
}
