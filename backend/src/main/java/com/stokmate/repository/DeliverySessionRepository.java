package com.stokmate.repository;

import com.stokmate.domain.DeliverySession;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliverySessionRepository extends JpaRepository<DeliverySession, UUID> {
    Optional<DeliverySession> findByToken(String token);

    Optional<DeliverySession> findByShipmentId(UUID shipmentId);
}
