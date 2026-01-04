package com.stokmate.mapper;

import com.stokmate.domain.Sale;
import com.stokmate.domain.SaleProduct;
import com.stokmate.dto.sale.SaleProductResponse;
import com.stokmate.dto.sale.SaleResponse;
import com.stokmate.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SaleMapper {

    private final SaleProductMapper saleProductMapper;
    private final StorageService storageService;

    public SaleResponse toResponse(Sale sale) {
        if (sale == null) {
            return null;
        }

        List<SaleProductResponse> productResponses = sale.getProducts().stream()
                .map(saleProductMapper::toResponse)
                .collect(Collectors.toList());

        BigDecimal totalAmount = sale.getProducts().stream()
                .map(SaleProduct::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String contractUrl = null;
        if (sale.getContractFileKey() != null) {
            try {
                contractUrl = storageService.getPresignedUrl(sale.getContractFileKey());
            } catch (Exception e) {
                contractUrl = null;
            }
        }

        return SaleResponse.builder()
                .id(sale.getId())
                .saleNo(sale.getSaleNo())
                .customerId(sale.getCustomer().getId())
                .customerName(sale.getCustomer().getFirstName() + " " + sale.getCustomer().getLastName())
                .customerPhone(sale.getCustomer().getPhone())
                .salesConsultantId(sale.getSalesConsultant().getId())
                .salesConsultantName(
                        sale.getSalesConsultant().getFirstName() + " " + sale.getSalesConsultant().getLastName())
                .contractNo(sale.getContractNo())
                .contractFileKey(sale.getContractFileKey())
                .contractDownloadUrl(contractUrl)
                .saleDate(sale.getSaleDate())
                .status(sale.getStatus())
                .notes(sale.getNotes())
                .products(productResponses)
                .totalAmount(totalAmount)
                .createdAt(LocalDateTime.ofInstant(sale.getCreatedAt(), java.time.ZoneId.systemDefault()))
                .updatedAt(LocalDateTime.ofInstant(sale.getUpdatedAt(), java.time.ZoneId.systemDefault()))
                .createdBy(sale.getCreatedBy())
                .build();
    }
}
