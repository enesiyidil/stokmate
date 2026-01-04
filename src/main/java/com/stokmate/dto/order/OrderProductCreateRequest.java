package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a single OrderProduct within an Order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderProductCreateRequest {

    @NotBlank(message = "Product name is required")
    @JsonProperty("productName")
    private String productName;

    @NotBlank(message = "Product code is required")
    @JsonProperty("productCode")
    private String productCode;

    @JsonProperty("specName")
    private String specName;

    @JsonProperty("productGroupDefinition")
    private String productGroupDefinition;

    @JsonProperty("warehouseLocation")
    private String warehouseLocation;

    @JsonProperty("productionLocationName")
    private String productionLocationName;

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

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
    @JsonProperty("quantity")
    private BigDecimal quantity;
}
