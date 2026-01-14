package com.stokmate.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private StatItem totalOrders;
    private StatItem totalSales; // Stock sales
    private StatItem activeStaff; // Total active staff (trend is new staff this month)
    private StatItem totalShipments;
    private StatItem newCustomers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatItem {
        private String value; // Formatted value (e.g. "150", "₺8.4M")
        private String subValue; // e.g. "12 Devam Eden"
        private String trend; // e.g. "+12%"
        private String trendType; // "up", "down", "neutral"
    }
}
