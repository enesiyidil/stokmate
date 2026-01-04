package com.stokmate.dto.orderreceipt;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReceiptPhotoResponse {

    private UUID id;
    private String fileName;
    private Long fileSize;
    private String downloadUrl;
}
