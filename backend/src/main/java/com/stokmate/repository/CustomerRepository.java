package com.stokmate.repository;

import com.stokmate.domain.Customer;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Page<Customer> findByIsDeleted(Boolean isDeleted, Pageable pageable);

    // ===================== PAGINATED QUERY WITH SEARCH =====================
    @Query(value = "SELECT c FROM Customer c WHERE c.isDeleted = false " +
            "AND (:search IS NULL " +
            "     OR LOWER(c.firstName) LIKE :search " +
            "     OR LOWER(c.lastName) LIKE :search " +
            "     OR LOWER(c.phone) LIKE :search " +
            "     OR LOWER(c.email) LIKE :search " +
            "     OR LOWER(c.city) LIKE :search) " +
            "ORDER BY c.firstName ASC, c.lastName ASC", countQuery = "SELECT COUNT(c) FROM Customer c WHERE c.isDeleted = false "
                    +
                    "AND (:search IS NULL " +
                    "     OR LOWER(c.firstName) LIKE :search " +
                    "     OR LOWER(c.lastName) LIKE :search " +
                    "     OR LOWER(c.phone) LIKE :search " +
                    "     OR LOWER(c.email) LIKE :search " +
                    "     OR LOWER(c.city) LIKE :search)")
    Page<Customer> findPagedWithSearch(@Param("search") String search, Pageable pageable);
}
