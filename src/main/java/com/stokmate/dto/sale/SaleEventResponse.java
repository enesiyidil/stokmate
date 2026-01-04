package com.stokmate.dto.sale;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for sale event responses
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleEventResponse {

    private UUID id;

    private String eventType;

    private String description;

    private String createdByName;

    private LocalDateTime createdAt;
}
