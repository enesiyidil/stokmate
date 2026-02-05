package com.stokmate.dto.customer;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String phone;
    private String alternatePhone;
    private String email;
    private String tcNo;
    private String city;
    private String district;
    private String neighborhood;
    private String fullAddress;
}
