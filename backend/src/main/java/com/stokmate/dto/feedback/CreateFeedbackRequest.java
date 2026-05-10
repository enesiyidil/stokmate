package com.stokmate.dto.feedback;

import com.stokmate.domain.FeedbackSeverity;
import com.stokmate.domain.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFeedbackRequest {

    @NotBlank(message = "Başlık zorunludur")
    @Size(max = 200, message = "Başlık en fazla 200 karakter olabilir")
    private String title;

    @NotBlank(message = "Açıklama zorunludur")
    @Size(max = 5000, message = "Açıklama en fazla 5000 karakter olabilir")
    private String description;

    @NotNull(message = "Geri bildirim türü zorunludur")
    private FeedbackType type;

    private FeedbackSeverity severity;

    @Size(max = 500)
    private String pageUrl;

    private Integer rating;
}
