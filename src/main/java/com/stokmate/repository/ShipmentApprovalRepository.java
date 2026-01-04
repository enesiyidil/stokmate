package com.stokmate.repository;

import com.stokmate.domain.ShipmentApproval;
import com.stokmate.domain.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShipmentApprovalRepository extends JpaRepository<ShipmentApproval, UUID> {

    List<ShipmentApproval> findByStatus(ApprovalStatus status);

    List<ShipmentApproval> findByOrderId(UUID orderId);
}
