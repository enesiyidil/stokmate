package com.stokmate.repository;

import com.stokmate.domain.OrderActivity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderActivityRepository extends JpaRepository<OrderActivity, UUID> {

        List<OrderActivity> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

        List<OrderActivity> findByUserIdOrderByCreatedAtDesc(UUID userId);

        List<OrderActivity> findTop5ByOrderByCreatedAtDesc();

        @org.springframework.data.jpa.repository.Query("SELECT oa FROM OrderActivity oa WHERE " +
                        "(:activityTypes IS NULL OR oa.activityType IN :activityTypes) AND " +
                        "(:search IS NULL OR LOWER(CAST(oa.user.firstName AS string)) LIKE :search OR " +
                        "LOWER(CAST(oa.user.lastName AS string)) LIKE :search OR " +
                        "LOWER(CAST(oa.description AS string)) LIKE :search)")
        org.springframework.data.domain.Page<OrderActivity> findAllWithFilters(
                        @org.springframework.data.repository.query.Param("activityTypes") List<com.stokmate.domain.ActivityType> activityTypes,
                        @org.springframework.data.repository.query.Param("search") String search,
                        org.springframework.data.domain.Pageable pageable);
}
