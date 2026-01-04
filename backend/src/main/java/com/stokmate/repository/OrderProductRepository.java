package com.stokmate.repository;

import com.stokmate.domain.OrderProduct;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderProductRepository extends JpaRepository<OrderProduct, UUID> {
}
