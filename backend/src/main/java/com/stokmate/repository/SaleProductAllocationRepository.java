package com.stokmate.repository;

import com.stokmate.domain.SaleProduct;
import com.stokmate.domain.SaleProductAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SaleProductAllocationRepository extends JpaRepository<SaleProductAllocation, UUID> {

    List<SaleProductAllocation> findBySaleProduct(SaleProduct saleProduct);

    List<SaleProductAllocation> findBySaleProductId(UUID saleProductId);

    void deleteBySaleProduct(SaleProduct saleProduct);
}
