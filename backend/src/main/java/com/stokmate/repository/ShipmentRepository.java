package com.stokmate.repository;

import com.stokmate.domain.Shipment;
import com.stokmate.domain.ShipmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

        @EntityGraph(attributePaths = { "order", "order.salesConsultant", "order.customer", "order.products", "sale",
                        "shippedBy", "approvedBy", "vehicle" })
        List<Shipment> findByStatus(ShipmentStatus status);

        @EntityGraph(attributePaths = { "order", "order.salesConsultant", "order.customer", "order.products", "sale",
                        "shippedBy", "approvedBy", "vehicle" })
        List<Shipment> findByOrderId(UUID orderId);

        @EntityGraph(attributePaths = { "order", "order.salesConsultant", "order.customer", "order.products", "sale",
                        "shippedBy", "approvedBy", "vehicle" })
        List<Shipment> findBySaleId(UUID saleId);

        @EntityGraph(attributePaths = { "order", "order.salesConsultant", "order.customer", "order.products", "sale",
                        "shippedBy", "approvedBy", "vehicle" })
        Optional<Shipment> findById(UUID id);

        List<Shipment> findByOrder(com.stokmate.domain.Order order);
}
