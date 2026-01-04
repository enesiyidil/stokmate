package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data class representing a grouped order from Excel extraction
 * Contains order header info and all products belonging to this order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderGroupData {

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("prosapContractNo")
    private String prosapContractNo;

    @JsonProperty("prosapContractNameSurname")
    private String prosapContractNameSurname;

    @JsonProperty("orderDate")
    private LocalDate orderDate;

    @JsonProperty("products")
    @Builder.Default
    private List<OrderProductExcelRow> products = new ArrayList<>();

    /**
     * Add a product to this order group
     */
    public void addProduct(OrderProductExcelRow product) {
        this.products.add(product);
    }

    /**
     * Get total product count for this order
     */
    public int getProductCount() {
        return this.products.size();
    }
}
