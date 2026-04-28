package com.stokmate.repository;

import com.stokmate.domain.BalancePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BalancePaymentRepository extends JpaRepository<BalancePayment, UUID> {

    List<BalancePayment> findByBalanceLedgerIdOrderByCreatedAtAsc(UUID balanceLedgerId);
}
