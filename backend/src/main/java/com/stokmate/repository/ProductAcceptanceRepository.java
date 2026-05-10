package com.stokmate.repository;

import com.stokmate.domain.ProductAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface ProductAcceptanceRepository extends JpaRepository<ProductAcceptance, String> {

        @Query(value = "SELECT pa FROM ProductAcceptance pa " +
                        "JOIN pa.orderProduct op " +
                        "JOIN op.order o " +
                        "LEFT JOIN pa.acceptedBy ab " +
                        "WHERE (:search IS NULL OR LOWER(op.productName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
                        "   OR LOWER(op.productCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
                        "   OR LOWER(o.orderNo) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
                        "AND (:status IS NULL OR pa.status = :status) " +
                        "AND (:brand IS NULL OR CAST(op.brand AS string) = :brand) " +
                        "AND (:acceptedBy IS NULL OR ab.id = :acceptedBy) " +
                        "ORDER BY pa.acceptanceDate DESC", countQuery = "SELECT COUNT(pa) FROM ProductAcceptance pa " +
                                        "JOIN pa.orderProduct op " +
                                        "JOIN op.order o " +
                                        "LEFT JOIN pa.acceptedBy ab " +
                                        "WHERE (:search IS NULL OR LOWER(op.productName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
                                        "   OR LOWER(op.productCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
                                        "   OR LOWER(o.orderNo) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
                                        "AND (:status IS NULL OR pa.status = :status) " +
                                        "AND (:brand IS NULL OR CAST(op.brand AS string) = :brand) " +
                                        "AND (:acceptedBy IS NULL OR ab.id = :acceptedBy)")
        Page<ProductAcceptance> findAllPaged(
                        @Param("search") String search,
                        @Param("status") ProductAcceptance.AcceptanceStatus status,
                        @Param("brand") String brand,
                        @Param("acceptedBy") java.util.UUID acceptedBy,
                        Pageable pageable);

        @Query("SELECT pa FROM ProductAcceptance pa " +
                        "JOIN FETCH pa.orderProduct op " +
                        "JOIN FETCH op.order o " +
                        "WHERE o.id = :orderId " +
                        "ORDER BY pa.acceptanceDate DESC")
        List<ProductAcceptance> findByOrderIdOrderByAcceptanceDateDesc(@Param("orderId") String orderId);

        @Query("SELECT pa FROM ProductAcceptance pa " +
                        "JOIN FETCH pa.orderProduct op " +
                        "WHERE op.id = :orderProductId " +
                        "ORDER BY pa.acceptanceDate DESC")
        List<ProductAcceptance> findByOrderProductIdOrderByAcceptanceDateDesc(
                        @Param("orderProductId") String orderProductId);

        @Query("SELECT pa FROM ProductAcceptance pa " +
                        "JOIN FETCH pa.orderProduct op " +
                        "JOIN FETCH pa.acceptedBy " +
                        "WHERE pa.status = :status " +
                        "ORDER BY pa.acceptanceDate DESC")
        List<ProductAcceptance> findByStatusOrderByAcceptanceDateDesc(
                        @Param("status") ProductAcceptance.AcceptanceStatus status);
}
