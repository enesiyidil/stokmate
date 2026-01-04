package com.stokmate.repository;

import com.stokmate.domain.ProductArrival;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductArrivalRepository extends JpaRepository<ProductArrival, UUID> {

    List<ProductArrival> findByProductIdOrderByArrivedAtDesc(UUID productId);

    List<ProductArrival> findByOrderId(UUID orderId);
}
