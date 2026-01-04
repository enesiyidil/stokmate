package com.stokmate.repository;

import com.stokmate.domain.OrderReceipt;
import com.stokmate.domain.OrderReceiptPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderReceiptPhotoRepository extends JpaRepository<OrderReceiptPhoto, UUID> {

    List<OrderReceiptPhoto> findByOrderReceipt(OrderReceipt orderReceipt);

    List<OrderReceiptPhoto> findByOrderReceipt_Id(UUID orderReceiptId);
}
