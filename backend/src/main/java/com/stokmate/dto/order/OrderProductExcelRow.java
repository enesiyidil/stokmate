package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for extracting data from Excel file upload
 * Represents a single row from the Excel table
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderProductExcelRow {

    @JsonProperty("productName")
    private String productName;

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

    @JsonProperty("brand")
    private String brand; // String because it comes from Excel

    @JsonProperty("quantity")
    private BigDecimal quantity;
}
