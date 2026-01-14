package com.stokmate.repository;

import com.stokmate.domain.BusinessActivity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessActivityRepository extends JpaRepository<BusinessActivity, String> {

        @Query("SELECT ba FROM BusinessActivity ba WHERE " +
                        "(:domain IS NULL OR ba.domain = :domain) AND " +
                        "(:search IS NULL OR LOWER(ba.userFullName) LIKE :search OR " +
                        "LOWER(ba.description) LIKE :search OR " +
                        "LOWER(ba.referenceNo) LIKE :search)")
        Page<BusinessActivity> findAllWithFilters(
                        @Param("domain") String domain,
                        @Param("search") String search,
                        Pageable pageable);
}
