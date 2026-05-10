package com.stokmate.repository;

import com.stokmate.domain.OrderProduct;
import com.stokmate.domain.OrderProductAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderProductAllocationRepository extends JpaRepository<OrderProductAllocation, UUID> {

    List<OrderProductAllocation> findByOrderProduct(OrderProduct orderProduct);

    void deleteByOrderProduct(OrderProduct orderProduct);
}
