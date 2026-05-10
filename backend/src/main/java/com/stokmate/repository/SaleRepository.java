package com.stokmate.repository;

import com.stokmate.domain.Sale;
import com.stokmate.domain.SaleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        long countByCreatedAtBetween(java.time.Instant start, java.time.Instant end);

        long countByCreatedAtBetweenAndStatusIn(java.time.Instant start, java.time.Instant end,
                        java.util.Collection<SaleStatus> statuses);

        @Query("SELECT s FROM Sale s WHERE " +
                        "(:status is null OR s.status = :status) AND " +
                        "(:consultantId is null OR s.salesConsultant.id = :consultantId) " +
                        "ORDER BY s.saleDate DESC")
        List<Sale> findFiltered(@Param("status") SaleStatus status,
                        @Param("consultantId") UUID consultantId);

        List<Sale> findByCustomerId(UUID customerId);

        // ===================== PAGINATED QUERY =====================
        @Query(value = "SELECT s FROM Sale s " +
                        "LEFT JOIN s.customer c " +
                        "LEFT JOIN s.salesConsultant sc " +
                        "WHERE (:statusGroup IS NULL " +
                        "     OR (:statusGroup = 'DEVAM_EDIYOR' AND s.status NOT IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.IPTAL_EDILDI, com.stokmate.domain.SaleStatus.DELIVERED)) "
                        +
                        "     OR (:statusGroup = 'TAMAMLANDI' AND s.status IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.DELIVERED)) "
                        +
                        "     OR (:statusGroup = 'IPTAL_EDILDI' AND s.status = com.stokmate.domain.SaleStatus.IPTAL_EDILDI)) "
                        +
                        "AND (:consultantId IS NULL OR sc.id = :consultantId) " +
                        "AND (:search IS NULL " +
                        "     OR LOWER(s.saleNo) LIKE :search " +
                        "     OR LOWER(s.contractNo) LIKE :search " +
                        "     OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :search " +
                        "     OR LOWER(CONCAT(sc.firstName, ' ', sc.lastName)) LIKE :search) " +
                        "ORDER BY " +
                        "CASE WHEN s.status IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.IPTAL_EDILDI, com.stokmate.domain.SaleStatus.DELIVERED) THEN 1 ELSE 0 END ASC, "
                        +
                        "CASE WHEN s.status NOT IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.IPTAL_EDILDI, com.stokmate.domain.SaleStatus.DELIVERED) THEN s.saleDate END ASC, "
                        +
                        "CASE WHEN s.status IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.IPTAL_EDILDI, com.stokmate.domain.SaleStatus.DELIVERED) THEN s.saleDate END DESC", countQuery = "SELECT COUNT(s) FROM Sale s "
                                        +
                                        "LEFT JOIN s.customer c " +
                                        "LEFT JOIN s.salesConsultant sc " +
                                        "WHERE (:statusGroup IS NULL " +
                                        "     OR (:statusGroup = 'DEVAM_EDIYOR' AND s.status NOT IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.IPTAL_EDILDI, com.stokmate.domain.SaleStatus.DELIVERED)) "
                                        +
                                        "     OR (:statusGroup = 'TAMAMLANDI' AND s.status IN (com.stokmate.domain.SaleStatus.TAMAMLANDI, com.stokmate.domain.SaleStatus.DELIVERED)) "
                                        +
                                        "     OR (:statusGroup = 'IPTAL_EDILDI' AND s.status = com.stokmate.domain.SaleStatus.IPTAL_EDILDI)) "
                                        +
                                        "AND (:consultantId IS NULL OR sc.id = :consultantId) " +
                                        "AND (:search IS NULL " +
                                        "     OR LOWER(s.saleNo) LIKE :search " +
                                        "     OR LOWER(s.contractNo) LIKE :search " +
                                        "     OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :search " +
                                        "     OR LOWER(CONCAT(sc.firstName, ' ', sc.lastName)) LIKE :search)")
        Page<Sale> findPagedWithFilters(
                        @Param("statusGroup") String statusGroup,
                        @Param("consultantId") UUID consultantId,
                        @Param("search") String search,
                        Pageable pageable);
}
