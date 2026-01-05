package com.stokmate.repository;

import com.stokmate.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByRole(com.stokmate.domain.Role role);

    java.util.List<User> findByRole(com.stokmate.domain.Role role);

    Optional<User> findByDeletedAlias(String deletedAlias);

    java.util.List<User> findByDeletedFalse();

    Optional<User> findByEmailAndDeletedFalse(String email);
}
