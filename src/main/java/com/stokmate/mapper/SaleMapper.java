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
        private final com.stokmate.repository.ShipmentRepository shipmentRepository;

        public SaleResponse toResponse(Sale sale) {
                if (sale == null) {
                        return null;
                }

                List<com.stokmate.domain.Shipment> shipments = shipmentRepository.findBySaleId(sale.getId());

                List<SaleProductResponse> productResponses = sale.getProducts().stream()
                                .map(sp -> {
                                        SaleProductResponse response = saleProductMapper.toResponse(sp);

                                        int pending = 0;
                                        int shipped = 0;
                                        int delivered = 0;

                                        for (com.stokmate.domain.Shipment s : shipments) {
                                                if (s.getItems() == null)
                                                        continue;

                                                for (com.stokmate.domain.ShipmentItem item : s.getItems()) {
                                                        if (item.getSaleProduct() != null && item.getSaleProduct()
                                                                        .getId().equals(sp.getId())) {
                                                                if (s.getStatus() == com.stokmate.domain.ShipmentStatus.PENDING) {
                                                                        pending += item.getShippedQuantity();
                                                                } else if (s.getStatus() == com.stokmate.domain.ShipmentStatus.COMPLETED
                                                                                || s.getStatus() == com.stokmate.domain.ShipmentStatus.FINALIZED) {
                                                                        delivered += item.getShippedQuantity();
                                                                } else {
                                                                        // APPROVED, PLANNED
                                                                        shipped += item.getShippedQuantity();
                                                                }
                                                        }
                                                }
                                        }

                                        response.setPendingShipmentQuantity(pending);
                                        response.setShippedQuantity(shipped);
                                        response.setDeliveredQuantity(delivered);
                                        return response;
                                })
                                .collect(Collectors.toList());

                BigDecimal totalAmount = sale.getProducts().stream()
                                .map(SaleProduct::getTotalPrice)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Return raw path for backend proxy (frontend uses /api/files/view)
                String contractUrl = sale.getContractFileKey();

                return SaleResponse.builder()
                                .id(sale.getId())
                                .saleNo(sale.getSaleNo())
                                .customerId(sale.getCustomer().getId())
                                .customerName(sale.getCustomer().getFirstName() + " "
                                                + sale.getCustomer().getLastName())
                                .customerPhone(sale.getCustomer().getPhone())
                                .salesConsultantId(sale.getSalesConsultant().getId())
                                .salesConsultantName(
                                                sale.getSalesConsultant().getFirstName() + " "
                                                                + sale.getSalesConsultant().getLastName())
                                .contractNo(sale.getContractNo())
                                .contractFileKey(sale.getContractFileKey())
                                .contractDownloadUrl(contractUrl)
                                .saleDate(sale.getSaleDate())
                                .status(sale.getStatus())
                                .notes(sale.getNotes())
                                .products(productResponses)
                                .totalAmount(totalAmount)
                                .createdAt(LocalDateTime.ofInstant(sale.getCreatedAt(),
                                                java.time.ZoneId.systemDefault()))
                                .updatedAt(LocalDateTime.ofInstant(sale.getUpdatedAt(),
                                                java.time.ZoneId.systemDefault()))
                                .createdBy(sale.getCreatedBy())
                                .build();
        }
}
