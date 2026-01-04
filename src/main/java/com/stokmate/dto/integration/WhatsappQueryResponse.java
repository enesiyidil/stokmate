package com.stokmate.dto.integration;

import com.stokmate.dto.product.ProductResponse;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WhatsappQueryResponse {
    private String answer;
    private List<ProductResponse> matchedProducts;
}
