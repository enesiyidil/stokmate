package com.stokmate.repository;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        // ===================== PAGINATED QUERIES =====================

        /**
         * Paginated list of orders with filters and search.
         * Custom sorting: ongoing orders first (by orderDate ASC), then
         * completed/cancelled (by orderDate DESC).
         * The CASE expression assigns sort priority: 0 for active, 1 for
         * completed/cancelled.
         */
        @Query(value = "SELECT o FROM Order o " +
                        "LEFT JOIN o.customer c " +
                        "LEFT JOIN o.salesConsultant sc " +
                        "WHERE (:includeHidden = true OR o.hidden = false) " +
                        "AND (:statusGroup IS NULL " +
                        "     OR (:statusGroup = 'DEVAM_EDIYOR' AND o.status NOT IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI, com.stokmate.domain.OrderStatus.IPTAL_EDILDI)) "
                        +
                        "     OR (:statusGroup = 'TAMAMLANDI' AND o.status IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI)) "
                        +
                        "     OR (:statusGroup = 'IPTAL_EDILDI' AND o.status IN (com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.IPTAL_EDILDI))) "
                        +
                        "AND (:orderType IS NULL OR o.orderType = :orderType) " +
                        "AND (:brand IS NULL OR EXISTS (SELECT 1 FROM o.products p WHERE CAST(p.brand AS string) = :brand)) "
                        +
                        "AND (:consultantId IS NULL OR sc.id = :consultantId) " +
                        "AND (:search IS NULL " +
                        "     OR LOWER(o.orderNo) LIKE :search " +
                        "     OR LOWER(o.prosapContractNo) LIKE :search " +
                        "     OR LOWER(o.prosapContractNameSurname) LIKE :search " +
                        "     OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :search " +
                        "     OR LOWER(CONCAT(sc.firstName, ' ', sc.lastName)) LIKE :search) " +
                        "ORDER BY " +
                        "CASE WHEN o.status IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI, com.stokmate.domain.OrderStatus.IPTAL_EDILDI) THEN 1 ELSE 0 END ASC, "
                        +
                        "CASE WHEN o.status NOT IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI, com.stokmate.domain.OrderStatus.IPTAL_EDILDI) THEN o.orderDate END ASC, "
                        +
                        "CASE WHEN o.status IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI, com.stokmate.domain.OrderStatus.IPTAL_EDILDI) THEN o.orderDate END DESC", countQuery = "SELECT COUNT(o) FROM Order o "
                                        +
                                        "LEFT JOIN o.customer c " +
                                        "LEFT JOIN o.salesConsultant sc " +
                                        "WHERE (:includeHidden = true OR o.hidden = false) " +
                                        "AND (:statusGroup IS NULL " +
                                        "     OR (:statusGroup = 'DEVAM_EDIYOR' AND o.status NOT IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI, com.stokmate.domain.OrderStatus.IPTAL_EDILDI)) "
                                        +
                                        "     OR (:statusGroup = 'TAMAMLANDI' AND o.status IN (com.stokmate.domain.OrderStatus.COMPLETED, com.stokmate.domain.OrderStatus.DELIVERED, com.stokmate.domain.OrderStatus.TAMAMLANDI)) "
                                        +
                                        "     OR (:statusGroup = 'IPTAL_EDILDI' AND o.status IN (com.stokmate.domain.OrderStatus.CANCELLED, com.stokmate.domain.OrderStatus.IPTAL_EDILDI))) "
                                        +
                                        "AND (:orderType IS NULL OR o.orderType = :orderType) " +
                                        "AND (:brand IS NULL OR EXISTS (SELECT 1 FROM o.products p WHERE CAST(p.brand AS string) = :brand)) "
                                        +
                                        "AND (:consultantId IS NULL OR sc.id = :consultantId) " +
                                        "AND (:search IS NULL " +
                                        "     OR LOWER(o.orderNo) LIKE :search " +
                                        "     OR LOWER(o.prosapContractNo) LIKE :search " +
                                        "     OR LOWER(o.prosapContractNameSurname) LIKE :search " +
                                        "     OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :search " +
                                        "     OR LOWER(CONCAT(sc.firstName, ' ', sc.lastName)) LIKE :search)")
        @EntityGraph(attributePaths = { "salesConsultant", "customer", "products" })
        Page<Order> findPagedWithFilters(
                        @Param("statusGroup") String statusGroup,
                        @Param("orderType") com.stokmate.domain.OrderType orderType,
                        @Param("brand") String brand,
                        @Param("consultantId") UUID consultantId,
                        @Param("search") String search,
                        @Param("includeHidden") boolean includeHidden,
                        Pageable pageable);
}
