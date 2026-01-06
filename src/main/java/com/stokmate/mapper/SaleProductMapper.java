package com.stokmate.mapper;

import com.stokmate.domain.SaleProduct;
import com.stokmate.dto.sale.SaleProductResponse;
import com.stokmate.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SaleProductMapper {

    private final StorageService storageService;

    public SaleProductResponse toResponse(SaleProduct saleProduct) {
        if (saleProduct == null) {
            return null;
        }

        // Return raw path for backend proxy (frontend uses /api/files/view)
        String imageUrl = saleProduct.getProduct().getImageUrl();

        return SaleProductResponse.builder()
                .id(saleProduct.getId())
                .productId(saleProduct.getProduct().getId())
                .productCode(saleProduct.getProduct().getCode())
                .productName(saleProduct.getProduct().getName())
                .productImageUrl(imageUrl)
                .quantity(saleProduct.getQuantity())
                .unitPriceExcludingVat(saleProduct.getUnitPriceExcludingVat())
                .vatRate(saleProduct.getVatRate())
                .internetSalesPrice(saleProduct.getInternetSalesPrice())
                .totalPrice(saleProduct.getTotalPrice())
                .build();
    }
}
