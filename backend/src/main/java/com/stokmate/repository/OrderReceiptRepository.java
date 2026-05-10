package com.stokmate.repository;

import com.stokmate.domain.OrderReceipt;
import com.stokmate.domain.OrderReceiptStatus;
import com.stokmate.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderReceiptRepository extends JpaRepository<OrderReceipt, UUID> {

    List<OrderReceipt> findByOrderProduct_Order_Id(UUID orderId);

    List<OrderReceipt> findByStatus(OrderReceiptStatus status);

    List<OrderReceipt> findByReceivedBy(User user);

    List<OrderReceipt> findByOrderProduct_Id(UUID orderProductId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT orc FROM OrderReceipt orc " +
            "JOIN orc.orderProduct op " +
            "JOIN op.order o " +
            "LEFT JOIN orc.receivedBy rb " +
            "LEFT JOIN orc.approvedBy ab " +
            "WHERE (:search IS NULL OR LOWER(op.productName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "   OR LOWER(op.productCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "   OR LOWER(o.orderNo) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "   OR LOWER(orc.driverName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR orc.status = :status) " +
            "AND (:receivedBy IS NULL OR rb.id = :receivedBy) " +
            "AND (:approvedBy IS NULL OR ab.id = :approvedBy) " +
            "ORDER BY orc.createdAt DESC", countQuery = "SELECT COUNT(orc) FROM OrderReceipt orc " +
                    "JOIN orc.orderProduct op " +
                    "JOIN op.order o " +
                    "LEFT JOIN orc.receivedBy rb " +
                    "LEFT JOIN orc.approvedBy ab " +
                    "WHERE (:search IS NULL OR LOWER(op.productName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                    "   OR LOWER(op.productCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                    "   OR LOWER(o.orderNo) LIKE LOWER(CONCAT('%', :search, '%')) " +
                    "   OR LOWER(orc.driverName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "AND (:status IS NULL OR orc.status = :status) " +
                    "AND (:receivedBy IS NULL OR rb.id = :receivedBy) " +
                    "AND (:approvedBy IS NULL OR ab.id = :approvedBy)")
    org.springframework.data.domain.Page<OrderReceipt> findAllPaged(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("status") OrderReceiptStatus status,
            @org.springframework.data.repository.query.Param("receivedBy") UUID receivedBy,
            @org.springframework.data.repository.query.Param("approvedBy") UUID approvedBy,
            org.springframework.data.domain.Pageable pageable);
}
