package com.stokmate.dto.store;

import com.stokmate.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreEmployeeResponse {
    private String id;
    private UserResponse user;
    private LocalDate joinDate;
    private boolean active;
}
