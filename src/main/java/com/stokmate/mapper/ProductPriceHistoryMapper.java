package com.stokmate.mapper;

import com.stokmate.domain.ProductPriceHistory;
import com.stokmate.dto.product.ProductPriceHistoryResponse;
import org.springframework.stereotype.Component;

@Component
public class ProductPriceHistoryMapper {

    public ProductPriceHistoryResponse toResponse(ProductPriceHistory history) {
        return ProductPriceHistoryResponse.builder()
                .id(history.getId())
                .grossPrice(history.getGrossPrice())
                .netPrice(history.getNetPrice())
                .fixedDiscount(history.getFixedDiscount())
                .cashDiscount(history.getCashDiscount())
                .displayDiscount(history.getDisplayDiscount())
                .discount1(history.getDiscount1())
                .discount2(history.getDiscount2())
                .discount3(history.getDiscount3())
                .discount4(history.getDiscount4())
                .discount5(history.getDiscount5())
                .vat(history.getVat())
                .paymentCondition(history.getPaymentCondition())
                .paymentConditionDefinition(history.getPaymentConditionDefinition())
                .quantity(history.getQuantity())
                .relatedOrderNo(history.getRelatedOrder() != null
                        ? history.getRelatedOrder().getOrderNo()
                        : null)
                .createdByName(history.getCreatedBy() != null
                        ? history.getCreatedBy().getFirstName() + " " + history.getCreatedBy().getLastName()
                        : null)
                .createdAt(history.getCreatedAt())
                .build();
    }
}
