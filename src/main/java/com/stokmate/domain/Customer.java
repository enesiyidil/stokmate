package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "customers")
public class Customer extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String phone;
    private String alternatePhone; // Yedek telefon numarası
    private String email;
    private String tcNo;
    private String city;
    private String district;
    private String neighborhood;
    private String fullAddress;

    // Soft delete fields added as per instruction
    @Column(nullable = false)
    private boolean deleted = false;

    private Instant deletionDate;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
