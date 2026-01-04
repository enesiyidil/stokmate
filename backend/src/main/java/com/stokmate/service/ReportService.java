package com.stokmate.service;
/*
 * import com.stokmate.dto.report.SalesReportResponse;
 * import com.stokmate.dto.sale.SaleResponse;
 * import java.math.BigDecimal;
 * import java.time.LocalDate;
 * import lombok.RequiredArgsConstructor;
 * import org.springframework.data.domain.Page;
 * import org.springframework.data.domain.Pageable;
 * import org.springframework.stereotype.Service;
 * 
 * // Temporarily disabled - Sale entities not yet implemented
 * 
 * @Service
 * 
 * @RequiredArgsConstructor
 * public class ReportService {
 * 
 * private final SaleService saleService;
 * 
 * public SalesReportResponse salesReport(LocalDate start, LocalDate end,
 * Pageable pageable) {
 * java.time.Instant startInstant = start != null ?
 * start.atStartOfDay().toInstant(java.time.ZoneOffset.UTC) : null;
 * java.time.Instant endInstant = end != null ?
 * end.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC) : null;
 * Page<SaleResponse> salesPage = saleService.list(null, startInstant,
 * endInstant, pageable);
 * BigDecimal totalNet = salesPage.stream()
 * .map(SaleResponse::getTotalNet)
 * .reduce(BigDecimal.ZERO, BigDecimal::add);
 * BigDecimal totalVat = salesPage.stream()
 * .map(SaleResponse::getTotalVat)
 * .reduce(BigDecimal.ZERO, BigDecimal::add);
 * return SalesReportResponse.builder()
 * .sales(salesPage.getContent())
 * .totalNet(totalNet)
 * .totalVat(totalVat)
 * .totalGross(totalNet.add(totalVat))
 * .build();
 * }
 * }
 */
