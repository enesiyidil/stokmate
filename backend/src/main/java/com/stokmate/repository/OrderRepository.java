package com.stokmate.repository;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

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
}
