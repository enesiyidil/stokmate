package com.stokmate.service;

import com.stokmate.domain.OrderStatus;
import com.stokmate.dto.dashboard.DashboardStatsDTO;
import com.stokmate.repository.OrderRepository;
import com.stokmate.repository.ShipmentRepository;
import com.stokmate.repository.UserRepository;
import com.stokmate.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final SaleRepository saleRepository;

    public DashboardStatsDTO getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfCurrentMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfPreviousMonth = startOfCurrentMonth.minusMonths(1);
        LocalDateTime endOfPreviousMonth = startOfCurrentMonth.minusSeconds(1);

        // Convert to Instant using system default zone
        ZoneId zoneId = ZoneId.systemDefault();
        Instant nowInstant = now.atZone(zoneId).toInstant();
        Instant startCurrentInstant = startOfCurrentMonth.atZone(zoneId).toInstant();
        Instant startPrevInstant = startOfPreviousMonth.atZone(zoneId).toInstant();
        Instant endPrevInstant = endOfPreviousMonth.atZone(zoneId).toInstant();
        Instant threeMonthsAgoInstant = startOfCurrentMonth.minusMonths(3).atZone(zoneId).toInstant();

        // --- 1. Total Orders ---
        long currentMonthOrders = orderRepository.countByCreatedAtBetween(startCurrentInstant, nowInstant);
        long previousMonthOrders = orderRepository.countByCreatedAtBetween(startPrevInstant, endPrevInstant);
        String ordersTrend = calculateTrend(currentMonthOrders, previousMonthOrders);
        String ordersTrendType = getTrendType(currentMonthOrders, previousMonthOrders);

        long ongoingOrders = orderRepository.countByCreatedAtBetweenAndStatusIn(
                threeMonthsAgoInstant,
                nowInstant,
                List.of(OrderStatus.CREATED, OrderStatus.PENDING_ACCEPTANCE, OrderStatus.PARTIALLY_ACCEPTED,
                        OrderStatus.ACCEPTED, OrderStatus.PENDING_SHIPMENT_APPROVAL, OrderStatus.SHIPMENT_APPROVED,
                        OrderStatus.IN_SHIPMENT, OrderStatus.PARTIALLY_SHIPPED, OrderStatus.DEVAM_EDIYOR));

        // --- 2. Active Staff (Trend: New Users this month) ---
        long totalActiveStaff = userRepository.count(); // Approximate active staff as total users for now
        long newUsersCurrentMonth = userRepository.countByCreatedAtBetween(startCurrentInstant, nowInstant);
        long newUsersPreviousMonth = userRepository.countByCreatedAtBetween(startPrevInstant, endPrevInstant);
        String staffTrend = calculateTrend(newUsersCurrentMonth, newUsersPreviousMonth);
        String staffTrendType = getTrendType(newUsersCurrentMonth, newUsersPreviousMonth);

        // --- 3. Shipments ---
        long currentMonthShipments = shipmentRepository.countByCreatedAtBetween(startCurrentInstant, nowInstant);
        long previousMonthShipments = shipmentRepository.countByCreatedAtBetween(startPrevInstant, endPrevInstant);
        String shipmentTrend = calculateTrend(currentMonthShipments, previousMonthShipments);
        String shipmentTrendType = getTrendType(currentMonthShipments, previousMonthShipments);

        long ongoingShipments = shipmentRepository.countByStatusIn(
                List.of(com.stokmate.domain.ShipmentStatus.PENDING,
                        com.stokmate.domain.ShipmentStatus.APPROVED,
                        com.stokmate.domain.ShipmentStatus.PLANNED));

        // --- 4. Stock Sales (Stoklu Satışlar) ---
        long currentMonthSales = saleRepository.countByCreatedAtBetween(startCurrentInstant, nowInstant);
        long previousMonthSales = saleRepository.countByCreatedAtBetween(startPrevInstant, endPrevInstant);
        String salesTrend = calculateTrend(currentMonthSales, previousMonthSales);
        String salesTrendType = getTrendType(currentMonthSales, previousMonthSales);

        long ongoingSales = saleRepository.countByCreatedAtBetweenAndStatusIn(
                threeMonthsAgoInstant,
                nowInstant,
                List.of(com.stokmate.domain.SaleStatus.DEVAM_EDIYOR,
                        com.stokmate.domain.SaleStatus.PENDING_SHIPMENT_APPROVAL,
                        com.stokmate.domain.SaleStatus.SHIPMENT_APPROVED,
                        com.stokmate.domain.SaleStatus.IN_SHIPMENT,
                        com.stokmate.domain.SaleStatus.PARTIALLY_SHIPPED));

        return DashboardStatsDTO.builder()
                .totalOrders(new DashboardStatsDTO.StatItem(
                        String.valueOf(currentMonthOrders),
                        ongoingOrders + " Devam Eden",
                        ordersTrend,
                        ordersTrendType))
                .activeStaff(new DashboardStatsDTO.StatItem(
                        String.valueOf(totalActiveStaff),
                        "Aktif Kullanıcı",
                        staffTrend, // Trend based on NEW users growth
                        staffTrendType))
                .totalShipments(new DashboardStatsDTO.StatItem(
                        String.valueOf(currentMonthShipments),
                        ongoingShipments + " Devam Eden",
                        shipmentTrend,
                        shipmentTrendType))
                .totalSales(new DashboardStatsDTO.StatItem(
                        String.valueOf(currentMonthSales),
                        ongoingSales + " Devam Eden",
                        salesTrend,
                        salesTrendType))
                .build();
    }

    private String calculateTrend(double current, double previous) {
        if (previous == 0) {
            return current > 0 ? "+100%" : "0%";
        }
        double change = ((current - previous) / previous) * 100;
        return (change > 0 ? "+" : "") + String.format("%.1f%%", change);
    }

    private String getTrendType(double current, double previous) {
        if (current > previous)
            return "up";
        if (current < previous)
            return "down";
        return "neutral";
    }
}
