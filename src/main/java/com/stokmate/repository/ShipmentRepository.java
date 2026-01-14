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
}
