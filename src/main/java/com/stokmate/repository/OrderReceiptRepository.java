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
}
