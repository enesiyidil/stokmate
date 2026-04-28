package com.stokmate.repository;

import com.stokmate.domain.Shipment;
import com.stokmate.domain.ShipmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import java.time.Instant;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

        long countByCreatedAtBetween(Instant start, Instant end);

        long countByStatusIn(java.util.Collection<ShipmentStatus> statuses);

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

        List<Shipment> findBySale(com.stokmate.domain.Sale sale);

        @EntityGraph(attributePaths = { "items", "items.orderProduct" })
        List<Shipment> findByOrderIdAndStatusIn(UUID orderId, java.util.Collection<ShipmentStatus> statuses);

        // Find problematic shipments for an order (completed shipments with problem
        // type set)
        // Using JPQL to avoid LOB fields that cause PostgreSQL auto-commit issues
        @org.springframework.data.jpa.repository.Query("SELECT new com.stokmate.dto.shipment.ProblemShipmentDTO(s.id, s.problemType, s.actualShipmentDate, s.linkedSshOrder.id) "
                        +
                        "FROM Shipment s LEFT JOIN s.linkedSshOrder " +
                        "WHERE s.order.id = :orderId AND s.problemType IS NOT NULL")
        List<com.stokmate.dto.shipment.ProblemShipmentDTO> findProblemShipmentsByOrderId(
                        @org.springframework.data.repository.query.Param("orderId") UUID orderId);

        // Calendar Queries

        // Admin, Director, Manager, Logistics, Ops: All shipments in range
        List<Shipment> findAllByPlannedShipmentDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

        // Store Manager: Shipments where sales consultant location matches manager
        // location
        @org.springframework.data.jpa.repository.Query("SELECT s FROM Shipment s " +
                        "LEFT JOIN s.order o " +
                        "LEFT JOIN s.sale sa " +
                        "LEFT JOIN o.salesConsultant osc " +
                        "LEFT JOIN sa.salesConsultant sasc " +
                        "WHERE (osc.location = :location OR sasc.location = :location) " +
                        "AND s.plannedShipmentDate BETWEEN :start AND :end")
        List<Shipment> findStoreShipments(
                        @org.springframework.data.repository.query.Param("location") String location,
                        @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
                        @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);

        // Store Employee: Shipments where they are the consultant
        @org.springframework.data.jpa.repository.Query("SELECT s FROM Shipment s " +
                        "LEFT JOIN s.order o " +
                        "LEFT JOIN s.sale sa " +
                        "WHERE (o.salesConsultant.id = :userId OR sa.salesConsultant.id = :userId) " +
                        "AND s.plannedShipmentDate BETWEEN :start AND :end")
        List<Shipment> findMyShipments(
                        @org.springframework.data.repository.query.Param("userId") UUID userId,
                        @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
                        @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);

        // Notification Queries

        // Find shipments planned for a specific time range (e.g., next hour or next
        // day)
        List<Shipment> findByNotified1DayFalseAndPlannedShipmentDateBetween(
                        java.time.LocalDateTime start, java.time.LocalDateTime end);

        List<Shipment> findByNotified1HourFalseAndPlannedShipmentDateBetween(
                        java.time.LocalDateTime start, java.time.LocalDateTime end);

        // Find shipments linked to a specific SSH order
        List<Shipment> findByLinkedSshOrderId(UUID sshOrderId);

        // ===================== PAGINATED QUERY =====================
        @org.springframework.data.jpa.repository.Query(value = "SELECT s FROM Shipment s " +
                        "LEFT JOIN s.order o " +
                        "LEFT JOIN o.customer oc " +
                        "LEFT JOIN s.sale sa " +
                        "LEFT JOIN sa.customer sc " +
                        "WHERE (:statusGroup IS NULL " +
                        "     OR (:statusGroup = 'PENDING' AND s.status = com.stokmate.domain.ShipmentStatus.PENDING) "
                        +
                        "     OR (:statusGroup = 'AWAITING' AND s.status = com.stokmate.domain.ShipmentStatus.APPROVED) "
                        +
                        "     OR (:statusGroup = 'READY' AND s.status = com.stokmate.domain.ShipmentStatus.PLANNED) "
                        +
                        "     OR (:statusGroup = 'PLANNED' AND s.status IN (com.stokmate.domain.ShipmentStatus.APPROVED, com.stokmate.domain.ShipmentStatus.PLANNED)) "
                        +
                        "     OR (:statusGroup = 'COMPLETED' AND s.status = com.stokmate.domain.ShipmentStatus.COMPLETED) "
                        +
                        "     OR (:statusGroup = 'FINALIZED' AND s.status = com.stokmate.domain.ShipmentStatus.FINALIZED)) "
                        +
                        "AND (:search IS NULL " +
                        "     OR LOWER(o.orderNo) LIKE :search " +
                        "     OR LOWER(sa.saleNo) LIKE :search " +
                        "     OR LOWER(CONCAT(COALESCE(oc.firstName,''), ' ', COALESCE(oc.lastName,''))) LIKE :search "
                        +
                        "     OR LOWER(CONCAT(COALESCE(sc.firstName,''), ' ', COALESCE(sc.lastName,''))) LIKE :search) "
                        +
                        "AND (:deliveryFilter IS NULL " +
                        "     OR (:deliveryFilter = 'NOT_DELIVERED' AND s.deliveryStatus IS NULL) " +
                        "     OR (:deliveryFilter = 'PROBLEM_FREE' AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEM_FREE) "
                        +
                        "     OR (:deliveryFilter = 'PROBLEMATIC' AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEMATIC)) "
                        +
                        "AND (:brand IS NULL " +
                        "     OR (:brand = 'MARKASIZ' AND " +
                        "         NOT EXISTS (SELECT 1 FROM OrderProduct op WHERE op.order = o AND op.brand IS NOT NULL) " +
                        "         AND NOT EXISTS (SELECT 1 FROM SaleProduct sp JOIN sp.product p WHERE sp.sale = sa AND p.brand IS NOT NULL)) "
                        +
                        "     OR (:brand <> 'MARKASIZ' AND (" +
                        "         EXISTS (SELECT 1 FROM OrderProduct op WHERE op.order = o AND CAST(op.brand AS string) = :brand) " +
                        "         OR EXISTS (SELECT 1 FROM SaleProduct sp JOIN sp.product p WHERE sp.sale = sa AND CAST(p.brand AS string) = :brand)" +
                        "     ))) " +
                        "AND (:problemResolved IS NULL " +
                        "     OR (:problemResolved = true AND s.problemResolved = true AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEMATIC) " +
                        "     OR (:problemResolved = false AND s.problemResolved = false AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEMATIC)) " +
                        "ORDER BY " +
                        "CASE s.status " +
                        "  WHEN com.stokmate.domain.ShipmentStatus.PENDING THEN 0 " +
                        "  WHEN com.stokmate.domain.ShipmentStatus.APPROVED THEN 1 " +
                        "  WHEN com.stokmate.domain.ShipmentStatus.PLANNED THEN 2 " +
                        "  WHEN com.stokmate.domain.ShipmentStatus.COMPLETED THEN 3 " +
                        "  WHEN com.stokmate.domain.ShipmentStatus.FINALIZED THEN 4 " +
                        "END ASC, " +
                        "s.createdAt ASC", countQuery = "SELECT COUNT(s) FROM Shipment s " +
                                        "LEFT JOIN s.order o " +
                                        "LEFT JOIN o.customer oc " +
                                        "LEFT JOIN s.sale sa " +
                                        "LEFT JOIN sa.customer sc " +
                                        "WHERE (:statusGroup IS NULL " +
                                        "     OR (:statusGroup = 'PENDING' AND s.status = com.stokmate.domain.ShipmentStatus.PENDING) "
                                        +
                                        "     OR (:statusGroup = 'AWAITING' AND s.status = com.stokmate.domain.ShipmentStatus.APPROVED) "
                                        +
                                        "     OR (:statusGroup = 'READY' AND s.status = com.stokmate.domain.ShipmentStatus.PLANNED) "
                                        +
                                        "     OR (:statusGroup = 'PLANNED' AND s.status IN (com.stokmate.domain.ShipmentStatus.APPROVED, com.stokmate.domain.ShipmentStatus.PLANNED)) "
                                        +
                                        "     OR (:statusGroup = 'COMPLETED' AND s.status = com.stokmate.domain.ShipmentStatus.COMPLETED) "
                                        +
                                        "     OR (:statusGroup = 'FINALIZED' AND s.status = com.stokmate.domain.ShipmentStatus.FINALIZED)) "
                                        +
                                        "AND (:search IS NULL " +
                                        "     OR LOWER(o.orderNo) LIKE :search " +
                                        "     OR LOWER(sa.saleNo) LIKE :search " +
                                        "     OR LOWER(CONCAT(COALESCE(oc.firstName,''), ' ', COALESCE(oc.lastName,''))) LIKE :search "
                                        +
                                        "     OR LOWER(CONCAT(COALESCE(sc.firstName,''), ' ', COALESCE(sc.lastName,''))) LIKE :search) "
                                        +
                                        "AND (:deliveryFilter IS NULL " +
                                        "     OR (:deliveryFilter = 'NOT_DELIVERED' AND s.deliveryStatus IS NULL) " +
                                        "     OR (:deliveryFilter = 'PROBLEM_FREE' AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEM_FREE) "
                                        +
                                        "     OR (:deliveryFilter = 'PROBLEMATIC' AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEMATIC)) "
                                        +
                                        "AND (:brand IS NULL " +
                                        "     OR (:brand = 'MARKASIZ' AND " +
                                        "         NOT EXISTS (SELECT 1 FROM OrderProduct op WHERE op.order = o AND op.brand IS NOT NULL) " +
                                        "         AND NOT EXISTS (SELECT 1 FROM SaleProduct sp JOIN sp.product p WHERE sp.sale = sa AND p.brand IS NOT NULL)) "
                                        +
                                        "     OR (:brand <> 'MARKASIZ' AND (" +
                                        "         EXISTS (SELECT 1 FROM OrderProduct op WHERE op.order = o AND CAST(op.brand AS string) = :brand) " +
                                        "         OR EXISTS (SELECT 1 FROM SaleProduct sp JOIN sp.product p WHERE sp.sale = sa AND CAST(p.brand AS string) = :brand)" +
                                        "     ))) " +
                                        "AND (:problemResolved IS NULL " +
                                        "     OR (:problemResolved = true AND s.problemResolved = true AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEMATIC) " +
                                        "     OR (:problemResolved = false AND s.problemResolved = false AND s.deliveryStatus = com.stokmate.domain.DeliveryStatus.PROBLEMATIC))")
        @EntityGraph(attributePaths = { "order", "order.salesConsultant", "order.customer", "order.products", "sale",
                        "shippedBy", "approvedBy", "vehicle" })
        org.springframework.data.domain.Page<Shipment> findPagedWithFilters(
                        @org.springframework.data.repository.query.Param("statusGroup") String statusGroup,
                        @org.springframework.data.repository.query.Param("search") String search,
                        @org.springframework.data.repository.query.Param("deliveryFilter") String deliveryFilter,
                        @org.springframework.data.repository.query.Param("brand") String brand,
                        @org.springframework.data.repository.query.Param("problemResolved") Boolean problemResolved,
                        org.springframework.data.domain.Pageable pageable);
}
