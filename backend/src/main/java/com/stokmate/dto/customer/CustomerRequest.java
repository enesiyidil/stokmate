package com.stokmate.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerRequest {
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    private String phone;
    @Email
    private String email;
    private String tcNo;
    private String city;
    private String district;
    private String neighborhood;
    private String fullAddress;
}
