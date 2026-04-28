package com.stokmate.dto.feedback;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFeedbackResponseRequest {

    @NotBlank(message = "Yanıt mesajı zorunludur")
    @Size(max = 2000, message = "Yanıt en fazla 2000 karakter olabilir")
    private String message;
}
