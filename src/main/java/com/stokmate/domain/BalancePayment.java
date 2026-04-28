package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "balance_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalancePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "balance_ledger_id", nullable = false)
    private BalanceLedger balanceLedger;

    @Column(nullable = false)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paid_by_user_id", nullable = false)
    private User paidBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // New due date for remaining balance after this payment
    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
