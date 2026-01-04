package com.stokmate.repository;

import com.stokmate.domain.SaleProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SaleProductRepository extends JpaRepository<SaleProduct, UUID> {
}
