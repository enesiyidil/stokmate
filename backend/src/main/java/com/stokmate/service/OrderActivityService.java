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
import org.springframework.transaction.annotation.Transactional;
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
     * Note: Using same transaction to ensure order is visible
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
     * Log a note added activity
     */
    @Transactional
    public void logNoteAdded(Order order, User user, String noteContent) {
        String truncatedContent = noteContent.length() > 30
                ? noteContent.substring(0, 30) + "..."
                : noteContent;
        String description = String.format("Not oluşturdu: \"%s\"", truncatedContent);

        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .user(user)
                .activityType(ActivityType.NOTE_ADDED)
                .description(description)
                .build();

        orderActivityRepository.save(activity);
        log.info("Logged note added for order {} by user {}", order.getOrderNo(), user.getEmail());
    }

    /**
     * Log a note strikethrough activity
     */
    @Transactional
    public void logNoteStrikethrough(Order order, User user, String noteContent) {
        String truncatedContent = noteContent.length() > 50
                ? noteContent.substring(0, 50) + "..."
                : noteContent;
        String description = String.format("Not üstü çizildi: \"%s\"", truncatedContent);

        OrderActivity activity = OrderActivity.builder()
                .order(order)
                .user(user)
                .activityType(ActivityType.NOTE_STRIKETHROUGH)
                .description(description)
                .build();

        orderActivityRepository.save(activity);
        log.info("Logged note strikethrough for order {} by user {}", order.getOrderNo(), user.getEmail());
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
     * Delete all activities for an order
     */
    @Transactional
    public void deleteActivitiesForOrder(UUID orderId) {
        orderActivityRepository.deleteByOrderId(orderId);
    }

    /**
     * Get all activities with pagination and filters
     */
    public org.springframework.data.domain.Page<OrderActivityResponse> getAllActivities(
            org.springframework.data.domain.Pageable pageable,
            String category,
            String search) {

        List<ActivityType> types = getActivityTypesByCategory(category);

        String searchPattern = null;
        if (search != null && !search.trim().isEmpty()) {
            searchPattern = "%" + search.trim().toLowerCase() + "%";
        }

        org.springframework.data.domain.Page<OrderActivity> page = orderActivityRepository.findAllWithFilters(
                types,
                searchPattern,
                pageable);

        return page.map(orderActivityMapper::toResponse);
    }

    private List<ActivityType> getActivityTypesByCategory(String category) {
        if (category == null || category.isEmpty())
            return null;

        List<ActivityType> types = new ArrayList<>();
        if ("ORDER".equalsIgnoreCase(category)) {
            types.add(ActivityType.CREATED);
            types.add(ActivityType.COMPLETED);
            types.add(ActivityType.CANCELLED);
            types.add(ActivityType.ORDER_UPDATED);
            types.add(ActivityType.PRODUCTS_ACCEPTED);
            types.add(ActivityType.PRODUCT_ACCEPTED);
        } else if ("SHIPMENT".equalsIgnoreCase(category)) {
            types.add(ActivityType.SHIPMENT_CREATED);
            types.add(ActivityType.SHIPMENT_UPDATED);
            types.add(ActivityType.SHIPMENT_APPROVED);
        } else if ("NOTE".equalsIgnoreCase(category)) {
            types.add(ActivityType.NOTE_ADDED);
            types.add(ActivityType.NOTE_STRIKETHROUGH);
        } else if ("INVOICE".equalsIgnoreCase(category)) {
            types.add(ActivityType.INVOICE_UPLOADED);
            types.add(ActivityType.INVOICE_DELETED);
        } else if ("CROSS_CONVERSION".equalsIgnoreCase(category)) {
            types.add(ActivityType.CROSS_CONVERSION_CREATED);
            types.add(ActivityType.CROSS_CONVERSION_UPDATED);
            types.add(ActivityType.CROSS_CONVERSION_DELETED);
        } else if ("BALANCE".equalsIgnoreCase(category)) {
            types.add(ActivityType.BALANCE_CREATED);
            types.add(ActivityType.BALANCE_PAYMENT_ADDED);
            types.add(ActivityType.BALANCE_UPDATED);
            types.add(ActivityType.BALANCE_DELETED);
            types.add(ActivityType.BALANCE_CLOSED);
        }
        return types;
    }

    /**
     * Get recent system-wide activities (for admin dashboard)
     */
    public List<OrderActivityResponse> getRecentSystemActivities() {
        List<OrderActivity> activities = orderActivityRepository.findTop5ByOrderByCreatedAtDesc();

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
