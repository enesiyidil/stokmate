package com.stokmate.dto.order;

import com.stokmate.dto.user.UserBasicResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for order events
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEventResponse {
    private UUID id;
    private UUID orderId;
    private String eventType;
    private String description;
    private Map<String, Object> eventData;
    private UserBasicResponse createdBy;
    private LocalDateTime createdAt;
}
