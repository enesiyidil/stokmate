package com.stokmate.dto.shipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentDetailsResponse {

    private String orderId;
    private String shipmentId; // Added for completion
    private String orderNo;
    private String orderType; // "ORDER" or "SALE"
    private LocalDateTime orderDate;
    private String contractNo;

    private CustomerInfo customer;
    private UserInfo salesConsultant;
    private UserInfo driver;
    private VehicleInfo vehicle;

    private List<ProductShipmentDetail> products;
    private String shipmentStatus;
    private LocalDateTime plannedShipmentDate;
    private String approvedBy;
    private String deliveryStatus;
    private String problemType;
    private String deliveryNotes;
    private String signedDocumentUrl;
    private List<String> deliveryPhotoUrls;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerInfo {
        private String name;
        private String phone;
        private String address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleInfo {
        private String id;
        private String licensePlate;
        private String vehicleType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductShipmentDetail {
        private String productCode;
        private String productName;
        private Integer totalQuantity;
        private Integer shippedQuantity;
        private Integer pendingQuantity;
        private Integer remainingQuantity;
    }
}
