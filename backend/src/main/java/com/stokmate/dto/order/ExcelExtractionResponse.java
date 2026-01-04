package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Excel file extraction endpoint
 * Returns grouped orders with their products, ready for creation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExcelExtractionResponse {

    @JsonProperty("orders")
    private List<OrderGroupData> orders;

    @JsonProperty("totalOrders")
    private Integer totalOrders;

    @JsonProperty("totalProducts")
    private Integer totalProducts;

    @JsonProperty("extractionStatus")
    private String extractionStatus; // "SUCCESS", "PARTIAL", "ERROR"

    @JsonProperty("message")
    private String message;
}
