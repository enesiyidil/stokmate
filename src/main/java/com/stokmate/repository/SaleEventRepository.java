package com.stokmate.repository;

import com.stokmate.domain.SaleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SaleEventRepository extends JpaRepository<SaleEvent, UUID> {

    List<SaleEvent> findBySaleIdOrderByCreatedAtDesc(UUID saleId);
}
