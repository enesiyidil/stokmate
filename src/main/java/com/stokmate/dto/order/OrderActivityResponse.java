package com.stokmate.dto.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.stokmate.domain.ActivityType;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderActivityResponse {

    private UUID id;

    @JsonProperty("orderId")
    private UUID orderId;

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("userId")
    private UUID userId;

    @JsonProperty("userEmail")
    private String userEmail;

    @JsonProperty("userFullName")
    private String userFullName;

    @JsonProperty("activityType")
    private ActivityType activityType;

    private String description;

    @JsonProperty("createdAt")
    private Instant createdAt;
}
