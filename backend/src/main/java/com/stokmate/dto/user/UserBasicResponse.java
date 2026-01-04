package com.stokmate.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Basic user information DTO for embedding in other responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBasicResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String displayName; // firstName + lastName or deletedAlias
}
