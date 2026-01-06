package com.stokmate.repository;

import com.stokmate.domain.OrderProduct;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderProductRepository extends JpaRepository<OrderProduct, UUID> {

    @org.springframework.data.jpa.repository.Query("SELECT op FROM OrderProduct op WHERE op.order.id = :orderId")
    java.util.List<OrderProduct> findByOrderId(
            @org.springframework.data.repository.query.Param("orderId") UUID orderId);
}
