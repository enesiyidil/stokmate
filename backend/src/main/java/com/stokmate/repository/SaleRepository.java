package com.stokmate.repository;

import com.stokmate.domain.Sale;
import com.stokmate.domain.SaleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, UUID> {

        Optional<Sale> findBySaleNo(String saleNo);

        @Query("SELECT s FROM Sale s WHERE " +
                        "(:status is null OR s.status = :status) AND " +
                        "(:consultantId is null OR s.salesConsultant.id = :consultantId) " +
                        "ORDER BY s.saleDate DESC")
        List<Sale> findFiltered(@Param("status") SaleStatus status,
                        @Param("consultantId") UUID consultantId);
}
