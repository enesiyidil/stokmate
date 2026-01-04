package com.stokmate.service;

import com.stokmate.domain.ActivityType;
import com.stokmate.domain.Order;
import com.stokmate.domain.OrderActivity;
import com.stokmate.domain.User;
import com.stokmate.dto.order.OrderActivityResponse;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.OrderActivityMapper;
import com.stokmate.repository.OrderActivityRepository;
import com.stokmate.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderActivityService {

    private final OrderActivityRepository orderActivityRepository;
    private final UserRepository userRepository;
    private final OrderActivityMapper orderActivityMapper;

    /**
     * Log an activity for an order with the current authenticated user
     */
    @Transactional
    public void logActivity(Order order, ActivityType activityType, String description) {
        User currentUser = getCurrentUser();

        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .user(currentUser)
                .activityType(activityType)
                .description(description)
                .build();

        orderActivityRepository.save(activity);
        log.info("Logged activity {} for order {} by user {}",
                activityType, order.getOrderNo(), currentUser.getEmail());
    }

    /**
     * Get all activities for an order
     */
    public List<OrderActivityResponse> getOrderActivities(UUID orderId) {
        List<OrderActivity> activities = orderActivityRepository.findByOrderIdOrderByCreatedAtDesc(orderId);

        List<OrderActivityResponse> responses = new ArrayList<>();
        for (OrderActivity activity : activities) {
            responses.add(orderActivityMapper.toResponse(activity));
        }
        return responses;
    }

    /**
     * Get all activities by a specific user
     */
    public List<OrderActivityResponse> getUserActivities(UUID userId) {
        List<OrderActivity> activities = orderActivityRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<OrderActivityResponse> responses = new ArrayList<>();
        for (OrderActivity activity : activities) {
            responses.add(orderActivityMapper.toResponse(activity));
        }
        return responses;
    }

    /**
     * Get all activities for the current user
     */
    public List<OrderActivityResponse> getCurrentUserActivities() {
        User currentUser = getCurrentUser();
        return getUserActivities(currentUser.getId());
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NotFoundException("User not authenticated");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found: " + email));
    }
}
