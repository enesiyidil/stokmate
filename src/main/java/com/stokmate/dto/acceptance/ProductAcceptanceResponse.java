package com.stokmate.dto.acceptance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAcceptanceResponse {

    private String id;
    private String orderNumber;
    private String productName;
    private String productCode;
    private BigDecimal acceptedQuantity;
    private String note;
    private String vehiclePlate;
    private String driverInfo;
    private List<String> imageUrls;
    private String acceptedByName;
    private String acceptedByEmail;
    private LocalDateTime acceptanceDate;
    private String status;
}
