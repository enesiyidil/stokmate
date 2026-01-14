package com.stokmate.repository;

import com.stokmate.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface UserRepository extends JpaRepository<User, UUID> {
    long countByCreatedAtBetween(Instant start, Instant end);

    Optional<User> findByEmail(String email);

    boolean existsByRole(com.stokmate.domain.Role role);

    java.util.List<User> findByRole(com.stokmate.domain.Role role);

    Optional<User> findByDeletedAlias(String deletedAlias);

    java.util.List<User> findByDeletedFalse();

    Optional<User> findByEmailAndDeletedFalse(String email);

    java.util.List<User> findByRoleAndLocation(com.stokmate.domain.Role role, String location);
}
