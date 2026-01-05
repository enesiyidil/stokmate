package com.stokmate.controller;

import com.stokmate.dto.order.OrderActivityResponse;
import com.stokmate.service.OrderActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/order-activities")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Order Activities")
public class OrderActivityController {

    private final OrderActivityService orderActivityService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE','OPERATIONS_MANAGER')")
    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get activities for an order", description = "Retrieves all activities (create, complete, cancel, accept products) for a specific order")
    public List<OrderActivityResponse> getOrderActivities(
            @io.swagger.v3.oas.annotations.Parameter(description = "Order ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("orderId") UUID orderId) {
        return orderActivityService.getOrderActivities(orderId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get activities by user (ADMIN only)", description = "Retrieves all order activities performed by a specific user")
    public List<OrderActivityResponse> getUserActivities(
            @io.swagger.v3.oas.annotations.Parameter(description = "User ID (UUID)", required = true, example = "123e4567-e89b-12d3-a456-426614174000") @PathVariable("userId") UUID userId) {
        return orderActivityService.getUserActivities(userId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','STORE_MANAGER','STORE_EMPLOYEE','OPERATIONS_MANAGER')")
    @GetMapping("/me")
    @Operation(summary = "Get current user's activities", description = "Retrieves all order activities performed by the currently authenticated user")
    public List<OrderActivityResponse> getMyActivities() {
        return orderActivityService.getCurrentUserActivities();
    }
}
