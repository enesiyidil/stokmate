package com.stokmate.repository;

import com.stokmate.domain.OrderActivity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderActivityRepository extends JpaRepository<OrderActivity, UUID> {

    List<OrderActivity> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    List<OrderActivity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
