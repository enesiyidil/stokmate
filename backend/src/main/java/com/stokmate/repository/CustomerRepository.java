package com.stokmate.repository;

import com.stokmate.domain.Customer;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    org.springframework.data.domain.Page<Customer> findByIsDeleted(Boolean isDeleted,
            org.springframework.data.domain.Pageable pageable);
}
