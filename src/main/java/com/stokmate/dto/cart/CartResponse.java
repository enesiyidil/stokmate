package com.stokmate.dto.cart;

import com.stokmate.domain.CartStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CartResponse {
    private UUID id;
    private UUID creatorId;
    private String creatorName;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
    private LocalDateTime createdDate;
    private CartStatus status;
}
