package com.stokmate.dto.user;

import com.stokmate.domain.Role;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private UUID id;
    private String email;
    private Role role;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String displayName;
}
