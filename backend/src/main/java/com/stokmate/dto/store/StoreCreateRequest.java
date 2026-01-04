package com.stokmate.dto.store;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StoreCreateRequest {

    @NotBlank(message = "Store code is required")
    private String code;

    @NotBlank(message = "Store name is required")
    private String name;

    private String address;
    private String phone;
    private String email;
    private String managerId;
}
