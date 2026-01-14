package com.stokmate.dto.order;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class CreateOrderNoteRequest {
    @NotBlank(message = "Not içeriği boş olamaz")
    @Size(max = 1000, message = "Not en fazla 1000 karakter olabilir")
    private String content;
}
