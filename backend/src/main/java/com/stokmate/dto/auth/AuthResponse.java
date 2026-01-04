package com.stokmate.dto.auth;

import com.stokmate.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private final String token;
    private final UserResponse user;
}
