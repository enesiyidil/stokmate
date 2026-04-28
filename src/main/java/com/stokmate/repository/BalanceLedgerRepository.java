package com.stokmate.repository;

import com.stokmate.domain.BalanceLedger;
import com.stokmate.domain.BalanceLedgerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BalanceLedgerRepository extends JpaRepository<BalanceLedger, UUID> {

        @Query("SELECT bl FROM BalanceLedger bl " +
                        "LEFT JOIN FETCH bl.customer c " +
                        "WHERE (:status IS NULL OR bl.status = :status) " +
                        "AND (:search IS NULL OR " +
                        "     LOWER(c.firstName) LIKE :search OR " +
                        "     LOWER(c.lastName) LIKE :search OR " +
                        "     LOWER(bl.contractNo) LIKE :search) " +
                        "AND (:dueDateFrom IS NULL OR bl.dueDate >= :dueDateFrom) " +
                        "AND (:dueDateTo IS NULL OR bl.dueDate <= :dueDateTo) " +
                        "ORDER BY " +
                        "CASE bl.status WHEN com.stokmate.domain.BalanceLedgerStatus.OPEN THEN 0 ELSE 1 END ASC, " +
                        "bl.createdAt DESC")
        List<BalanceLedger> findAllWithFilters(
                        @Param("status") BalanceLedgerStatus status,
                        @Param("search") String search,
                        @Param("dueDateFrom") LocalDate dueDateFrom,
                        @Param("dueDateTo") LocalDate dueDateTo);

        List<BalanceLedger> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

        // ===================== PAGINATED QUERY =====================
        @Query(value = "SELECT bl FROM BalanceLedger bl " +
                        "LEFT JOIN bl.customer c " +
                        "WHERE (:status IS NULL OR bl.status = :status) " +
                        "AND (:search IS NULL OR " +
                        "     LOWER(c.firstName) LIKE :search OR " +
                        "     LOWER(c.lastName) LIKE :search OR " +
                        "     LOWER(bl.contractNo) LIKE :search) " +
                        "AND (:dueDateFrom IS NULL OR bl.dueDate >= :dueDateFrom) " +
                        "AND (:dueDateTo IS NULL OR bl.dueDate <= :dueDateTo) " +
                        "ORDER BY " +
                        "CASE bl.status WHEN com.stokmate.domain.BalanceLedgerStatus.OPEN THEN 0 ELSE 1 END ASC, " +
                        "CASE WHEN bl.status = com.stokmate.domain.BalanceLedgerStatus.OPEN THEN bl.createdAt END ASC, "
                        +
                        "CASE WHEN bl.status != com.stokmate.domain.BalanceLedgerStatus.OPEN THEN bl.createdAt END DESC", countQuery = "SELECT COUNT(bl) FROM BalanceLedger bl "
                                        +
                                        "LEFT JOIN bl.customer c " +
                                        "WHERE (:status IS NULL OR bl.status = :status) " +
                                        "AND (:search IS NULL OR " +
                                        "     LOWER(c.firstName) LIKE :search OR " +
                                        "     LOWER(c.lastName) LIKE :search OR " +
                                        "     LOWER(bl.contractNo) LIKE :search) " +
                                        "AND (:dueDateFrom IS NULL OR bl.dueDate >= :dueDateFrom) " +
                                        "AND (:dueDateTo IS NULL OR bl.dueDate <= :dueDateTo)")
        Page<BalanceLedger> findPagedWithFilters(
                        @Param("status") BalanceLedgerStatus status,
                        @Param("search") String search,
                        @Param("dueDateFrom") LocalDate dueDateFrom,
                        @Param("dueDateTo") LocalDate dueDateTo,
                        Pageable pageable);
}
