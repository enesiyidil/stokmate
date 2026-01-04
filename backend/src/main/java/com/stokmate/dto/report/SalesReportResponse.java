package com.stokmate.dto.report;

import com.stokmate.dto.sale.SaleResponse;
import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SalesReportResponse {
    private List<SaleResponse> sales;
    private BigDecimal totalNet;
    private BigDecimal totalVat;
    private BigDecimal totalGross;
}
