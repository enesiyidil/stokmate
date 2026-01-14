package com.stokmate.dto.user;

import com.stokmate.domain.Role;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private Role role;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private boolean active;
    private String currentStoreName;
    private String currentStoreId;
    private LocalDate storeJoinDate;

    // New fields for sales consultant filtering
    private String location;
    private String department;

    // Soft delete fields
    private boolean deleted;
    private String deletedAlias;
    private String displayName; // firstName + lastName or deletedAlias

    // 2FA fields
    private boolean totpEnabled;
}
