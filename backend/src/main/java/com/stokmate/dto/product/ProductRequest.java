package com.stokmate.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String code;

    private String description;
    private com.stokmate.domain.Brand brand;

    @NotNull
    private Boolean activeForSale;

    @NotNull
    @DecimalMin("0")
    private BigDecimal stockQuantity;

    @NotNull
    @DecimalMin("0")
    private BigDecimal vatRate;

    @NotNull
    @DecimalMin("0")
    private BigDecimal unitPrice;

    private BigDecimal minStockLevel;
    private Set<String> keywords;
}
