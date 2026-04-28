package com.stokmate.dto.shipment;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
public class ResolveProblemRequest {
    private UUID shipmentId;
    private String description;
    private List<MultipartFile> photos;
}
