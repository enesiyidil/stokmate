package com.stokmate.dto.shipment;

import com.stokmate.domain.DeliveryStatus;
import com.stokmate.domain.ProblemType;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ShipmentCompletionRequest {
    private UUID shipmentId;
    private DeliveryStatus deliveryStatus;
    private ProblemType problemType;
    private String deliveryNotes;
    private MultipartFile signedDocument;
    private List<MultipartFile> deliveryPhotos;
}
