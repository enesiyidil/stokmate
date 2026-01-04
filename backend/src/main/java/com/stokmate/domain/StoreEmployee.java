package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "store_employees", uniqueConstraints = {
        @UniqueConstraint(name = "unique_active_user_store", columnNames = { "user_id", "store_id", "active" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StoreEmployee extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "join_date", nullable = false)
    private LocalDate joinDate;

    @Column(nullable = false)
    private boolean active = true;
}
