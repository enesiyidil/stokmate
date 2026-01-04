package com.stokmate.dto.store;

import lombok.Data;

@Data
public class StoreUpdateRequest {
    private String name;
    private String address;
    private String phone;
    private String email;
    private String managerId;
    private Boolean active;
}
