package com.stokmate.repository;

import com.stokmate.domain.ProductEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductEventRepository extends JpaRepository<ProductEvent, UUID> {

    Page<ProductEvent> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    List<ProductEvent> findByProductIdOrderByCreatedAtDesc(UUID productId);
}
