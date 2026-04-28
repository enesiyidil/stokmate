package com.stokmate.repository;

import com.stokmate.domain.Brand;
import com.stokmate.domain.CrossConversion;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrossConversionRepository extends JpaRepository<CrossConversion, UUID> {

    List<CrossConversion> findBySourceBrand(Brand sourceBrand);

    List<CrossConversion> findByTargetBrand(Brand targetBrand);

    @Query(value = "SELECT cc FROM CrossConversion cc " +
            "LEFT JOIN cc.order o " +
            "LEFT JOIN o.customer c " +
            "WHERE (:search IS NULL " +
            "     OR LOWER(o.orderNo) LIKE :search " +
            "     OR LOWER(o.prosapContractNo) LIKE :search " +
            "     OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :search) " +
            "AND (:sourceBrand IS NULL OR cc.sourceBrand = :sourceBrand) " +
            "AND (:targetBrand IS NULL OR cc.targetBrand = :targetBrand) " +
            "ORDER BY cc.createdAt DESC", countQuery = "SELECT COUNT(cc) FROM CrossConversion cc " +
                    "LEFT JOIN cc.order o " +
                    "LEFT JOIN o.customer c " +
                    "WHERE (:search IS NULL " +
                    "     OR LOWER(o.orderNo) LIKE :search " +
                    "     OR LOWER(o.prosapContractNo) LIKE :search " +
                    "     OR LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :search) " +
                    "AND (:sourceBrand IS NULL OR cc.sourceBrand = :sourceBrand) " +
                    "AND (:targetBrand IS NULL OR cc.targetBrand = :targetBrand)")
    Page<CrossConversion> findPagedWithSearch(
            @Param("search") String search,
            @Param("sourceBrand") Brand sourceBrand,
            @Param("targetBrand") Brand targetBrand,
            Pageable pageable);
}
