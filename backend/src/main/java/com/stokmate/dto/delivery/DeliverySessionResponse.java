package com.stokmate.dto.delivery;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;
import java.util.List;

@Data
@Builder
public class DeliverySessionResponse {
    private UUID shipmentId;
    private String customerName;
    private String customerAddress;
    private String customerPhone;
    private List<DeliveryProductInfo> products;
    private boolean completed;

    @Data
    @Builder
    public static class DeliveryProductInfo {
        private String name;
        private String code;
        private int quantity;
    }
}
