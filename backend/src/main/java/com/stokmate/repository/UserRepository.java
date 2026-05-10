package com.stokmate.repository;

import com.stokmate.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // ===================== PAGINATED QUERY =====================
    @Query(value = "SELECT u FROM User u WHERE u.deleted = false " +
            "AND (:search IS NULL " +
            "     OR LOWER(u.firstName) LIKE :search " +
            "     OR LOWER(u.lastName) LIKE :search " +
            "     OR LOWER(u.email) LIKE :search) " +
            "ORDER BY u.firstName ASC, u.lastName ASC", countQuery = "SELECT COUNT(u) FROM User u WHERE u.deleted = false "
                    +
                    "AND (:search IS NULL " +
                    "     OR LOWER(u.firstName) LIKE :search " +
                    "     OR LOWER(u.lastName) LIKE :search " +
                    "     OR LOWER(u.email) LIKE :search)")
    Page<User> findPagedWithSearch(@Param("search") String search, Pageable pageable);
}
