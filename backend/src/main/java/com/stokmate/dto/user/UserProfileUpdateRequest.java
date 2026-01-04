package com.stokmate.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
}
