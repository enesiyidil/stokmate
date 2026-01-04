package com.stokmate.dto.store;

import com.stokmate.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {
    private String id;
    private String code;
    private String name;
    private String address;
    private String phone;
    private String email;
    private boolean active;
    private UserResponse manager;
    private Instant createdAt;
    private Instant updatedAt;
}
