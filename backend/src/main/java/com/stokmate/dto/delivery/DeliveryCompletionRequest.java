package com.stokmate.dto.delivery;

import com.stokmate.domain.DeliveryStatus;
import com.stokmate.domain.ProblemType;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DeliveryCompletionRequest {
    private DeliveryStatus deliveryStatus;
    private String receiverName;
    private LocalDateTime deliveredAt;
    private String deliveryNotes;
    private ProblemType problemType;
    private MultipartFile signedDocument;
    private List<MultipartFile> deliveryPhotos;
}
