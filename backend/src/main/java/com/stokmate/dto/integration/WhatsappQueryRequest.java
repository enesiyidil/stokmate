package com.stokmate.dto.integration;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WhatsappQueryRequest {
    @NotBlank
    private String text;
}
