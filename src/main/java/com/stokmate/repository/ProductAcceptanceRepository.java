package com.stokmate.repository;

import com.stokmate.domain.ProductAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAcceptanceRepository extends JpaRepository<ProductAcceptance, String> {

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
