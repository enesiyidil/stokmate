package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean active = true;

    private String firstName;
    private String lastName;
    private String phone;
    private String address;

    // For sales consultant filtering
    private String location; // Mağaza/şube lokasyonu
    private String department; // Departman

    private String tempCodeHash;
    private java.time.Instant tempCodeExpiresAt;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean tempCodeUsed = false;

    // Two-Factor Authentication fields
    private String totpSecret; // TOTP secret for Google Authenticator

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean totpEnabled = false; // Whether 2FA is enabled for this user

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean totpSetupCompleted = false; // Whether user has completed QR code setup

    // Soft delete fields
    @Column(unique = true)
    private String deletedAlias;

    private java.time.Instant deletionDate;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean deleted = false;
}
