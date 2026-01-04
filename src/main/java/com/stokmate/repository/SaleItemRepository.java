package com.stokmate.repository;

import com.stokmate.domain.SaleItem;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {
}
