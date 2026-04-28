package com.stokmate.repository;

import com.stokmate.domain.BalanceActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BalanceActivityRepository extends JpaRepository<BalanceActivity, UUID> {

    void deleteByBalanceLedgerId(UUID balanceLedgerId);
}
