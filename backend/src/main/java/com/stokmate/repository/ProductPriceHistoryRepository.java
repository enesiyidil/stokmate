package com.stokmate.repository;

import com.stokmate.domain.ProductPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import java.math.BigDecimal;

@Repository
public interface ProductPriceHistoryRepository extends JpaRepository<ProductPriceHistory, UUID> {

    List<ProductPriceHistory> findByProductIdOrderByCreatedAtDesc(UUID productId);

    List<ProductPriceHistory> findByProductIdAndRemainingQuantityGreaterThanOrderByCreatedAtAsc(UUID productId,
            BigDecimal remainingQuantity);
}
