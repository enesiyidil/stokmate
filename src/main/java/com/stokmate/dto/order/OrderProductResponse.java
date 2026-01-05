package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderProductResponse {

    private UUID id;

    @JsonProperty("productName")
    private String productName;

    @JsonProperty("productCode")
    private String productCode;

    private BigDecimal acceptedQuantity;

    private BigDecimal remainingQuantity;

    @JsonProperty("specName")
    private String specName;

    @JsonProperty("productGroupDefinition")
    private String productGroupDefinition;

    @JsonProperty("warehouseLocation")
    private String warehouseLocation;

    @JsonProperty("productionLocationName")
    private String productionLocationName;

    // Admin only fields
    @JsonProperty("grossPrice")
    private BigDecimal grossPrice;

    @JsonProperty("netPrice")
    private BigDecimal netPrice;

    @JsonProperty("fixedDiscount")
    private BigDecimal fixedDiscount;

    @JsonProperty("cashDiscount")
    private BigDecimal cashDiscount;

    @JsonProperty("displayDiscount")
    private BigDecimal displayDiscount;

    @JsonProperty("discount1")
    private BigDecimal discount1;

    @JsonProperty("discount2")
    private BigDecimal discount2;

    @JsonProperty("discount3")
    private BigDecimal discount3;

    @JsonProperty("discount4")
    private BigDecimal discount4;

    @JsonProperty("discount5")
    private BigDecimal discount5;

    @JsonProperty("vat")
    private BigDecimal vat;

    @JsonProperty("paymentCondition")
    private String paymentCondition;

    @JsonProperty("paymentConditionDefinition")
    private String paymentConditionDefinition;

    @JsonProperty("brand")
    private com.stokmate.domain.Brand brand;

    @JsonProperty("quantity")
    private BigDecimal quantity;

    @JsonProperty("shippedQuantity")
    private BigDecimal shippedQuantity;

    @JsonProperty("pendingShipmentQuantity")
    private BigDecimal pendingShipmentQuantity;

    @JsonProperty("availableForShipmentQuantity")
    private BigDecimal availableForShipmentQuantity;
}
