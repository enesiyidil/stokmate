package com.stokmate.dto.support;

import com.stokmate.domain.RequestCategory;
import com.stokmate.domain.RequestPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSupportRequestRequest {
    @NotBlank(message = "Başlık zorunludur")
    @Size(max = 200, message = "Başlık en fazla 200 karakter olabilir")
    private String title;

    @Size(max = 2000, message = "Açıklama en fazla 2000 karakter olabilir")
    private String description;

    @NotNull(message = "Kategori zorunludur")
    private RequestCategory category;

    private RequestPriority priority = RequestPriority.MEDIUM;
}
