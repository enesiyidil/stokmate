package com.stokmate.repository;

import com.stokmate.domain.ProductStockHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductStockHistoryRepository extends JpaRepository<ProductStockHistory, UUID> {
    List<ProductStockHistory> findByProductIdOrderByCreatedAtDesc(UUID productId);
}
