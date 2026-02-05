package com.stokmate.repository;

import com.stokmate.domain.Product;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByCode(String code);

    @Query("select distinct p from Product p left join p.keywords k " +
            "where (lower(p.name) like lower(concat('%', :q, '%')) " +
            "or lower(p.description) like lower(concat('%', :q, '%')) " +
            "or lower(p.brand) like lower(concat('%', :q, '%')) " +
            "or lower(p.code) like lower(concat('%', :q, '%')) " +
            "or lower(k) like lower(concat('%', :q, '%'))) " +
            "and p.isDeleted = false")
    org.springframework.data.domain.Page<Product> search(@Param("q") String q,
            org.springframework.data.domain.Pageable pageable);
}
