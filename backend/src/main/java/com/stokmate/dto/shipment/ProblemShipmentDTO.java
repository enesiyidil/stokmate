package com.stokmate.dto.shipment;

import com.stokmate.domain.ProblemType;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for problem shipment data - used to avoid LOB fields in JPQL queries
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemShipmentDTO {
    private UUID shipmentId;
    private ProblemType problemType;
    private LocalDateTime actualShipmentDate;
    private UUID linkedSshOrderId;
}
