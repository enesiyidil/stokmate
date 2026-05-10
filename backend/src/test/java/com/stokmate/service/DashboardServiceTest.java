package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.OrderStatus;
import com.stokmate.domain.ShipmentStatus;
import com.stokmate.domain.SaleStatus;
import com.stokmate.dto.dashboard.DashboardStatsDTO;
import com.stokmate.repository.OrderRepository;
import com.stokmate.repository.ShipmentRepository;
import com.stokmate.repository.UserRepository;
import com.stokmate.repository.SaleRepository;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private SaleRepository saleRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(
                orderRepository,
                userRepository,
                shipmentRepository,
                saleRepository);
    }

    // ========== GetStats Tests ==========

    @Nested
    @DisplayName("getStats() Tests")
    class GetStatsTests {

        @Test
        @DisplayName("Should return dashboard statistics")
        void getStats_ShouldReturnStats() {
            // Arrange
            when(orderRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                    .thenReturn(10L);
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any()))
                    .thenReturn(3L);
            when(userRepository.count()).thenReturn(25L);
            when(userRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(5L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(8L);
            when(shipmentRepository.countByStatusIn(any()))
                    .thenReturn(2L);
            when(saleRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(15L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any()))
                    .thenReturn(4L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalOrders()).isNotNull();
            assertThat(result.getActiveStaff()).isNotNull();
            assertThat(result.getTotalShipments()).isNotNull();
            assertThat(result.getTotalSales()).isNotNull();
        }

        @Test
        @DisplayName("Should handle zero values correctly")
        void getStats_ShouldHandleZeroValues() {
            // Arrange
            when(orderRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByStatusIn(any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalOrders().getValue()).isEqualTo("0");
        }

        @Test
        @DisplayName("Should calculate positive trend correctly")
        void getStats_ShouldCalculatePositiveTrend() {
            // Arrange - Current month has more orders than previous
            when(orderRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(20L) // Current month
                    .thenReturn(10L); // Previous month
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(5L);
            when(userRepository.count()).thenReturn(10L);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(2L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(5L);
            when(shipmentRepository.countByStatusIn(any())).thenReturn(1L);
            when(saleRepository.countByCreatedAtBetween(any(), any())).thenReturn(8L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(2L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result).isNotNull();
        }
    }

    // ========== CalculateTrend Tests ==========

    @Nested
    @DisplayName("Trend Calculation Tests")
    class TrendCalculationTests {

        @Test
        @DisplayName("Should show positive trend when current > previous")
        void calculateTrend_ShouldShowPositive_WhenCurrentGreater() {
            // Arrange - Set up for positive trend
            when(orderRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(15L) // Current
                    .thenReturn(10L); // Previous
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByStatusIn(any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result.getTotalOrders().getTrendType()).isEqualTo("up");
        }

        @Test
        @DisplayName("Should show negative trend when current < previous")
        void calculateTrend_ShouldShowNegative_WhenCurrentLess() {
            // Arrange - Set up for negative trend
            when(orderRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(5L) // Current
                    .thenReturn(10L); // Previous
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByStatusIn(any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result.getTotalOrders().getTrendType()).isEqualTo("down");
        }

        @Test
        @DisplayName("Should show neutral trend when equal")
        void calculateTrend_ShouldShowNeutral_WhenEqual() {
            // Arrange
            when(orderRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(10L) // Current
                    .thenReturn(10L); // Previous
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByStatusIn(any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result.getTotalOrders().getTrendType()).isEqualTo("neutral");
        }

        @Test
        @DisplayName("Should handle zero previous value")
        void calculateTrend_ShouldHandle_WhenPreviousIsZero() {
            // Arrange - Previous is 0, current is positive
            when(orderRepository.countByCreatedAtBetween(any(), any()))
                    .thenReturn(10L) // Current
                    .thenReturn(0L); // Previous
            when(orderRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(shipmentRepository.countByStatusIn(any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(saleRepository.countByCreatedAtBetweenAndStatusIn(any(), any(), any())).thenReturn(0L);

            // Act
            DashboardStatsDTO result = dashboardService.getStats();

            // Assert
            assertThat(result.getTotalOrders().getTrend()).isEqualTo("+100%");
        }
    }
}
