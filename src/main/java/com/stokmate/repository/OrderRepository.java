package com.stokmate.repository;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByCreatedAtBetweenAndStatusIn(Instant start, Instant end, java.util.Collection<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(op.netPrice * op.quantity), 0) FROM Order o JOIN o.products op WHERE o.createdAt BETWEEN :start AND :end")
    BigDecimal sumTotalAmountByCreatedAtBetween(@Param("start") Instant start, @Param("end") Instant end);

    boolean existsByOrderNo(String orderNo);

    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    java.util.List<Order> findByStatus(OrderStatus status);

    java.util.List<Order> findByStatusAndProductsAccepted(OrderStatus status, boolean productsAccepted);

    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    java.util.List<Order> findByCustomerId(UUID customerId);

    // Override findById to eagerly fetch salesConsultant and other associations
    @Override
    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    Optional<Order> findById(UUID id);

    // Find all non-hidden orders (for main orders list)
    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    java.util.List<Order> findByHiddenFalse();

    // Find non-hidden orders by status
    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    java.util.List<Order> findByStatusAndHiddenFalse(OrderStatus status);

    // Find SSH orders by parent order
    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    java.util.List<Order> findByParentOrderId(UUID parentOrderId);

    // Find SSH orders linked to a specific shipment
    Optional<Order> findByLinkedShipmentId(UUID shipmentId);

    // Override findAll to eagerly fetch associations
    @Override
    @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
    java.util.List<Order> findAll();
}
