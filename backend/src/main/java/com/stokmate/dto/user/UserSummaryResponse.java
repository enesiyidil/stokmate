package com.stokmate.dto.user;

import com.stokmate.domain.Role;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private Role role;
    private String displayName;
}
