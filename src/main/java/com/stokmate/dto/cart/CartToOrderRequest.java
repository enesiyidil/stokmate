package com.stokmate.dto.cart;

import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@Data
@Builder
public class CartToOrderRequest {
    private UUID cartId;
    private UUID customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private MultipartFile contractFile;
    private String notes;
    private boolean partialShipmentEnabled;
}
