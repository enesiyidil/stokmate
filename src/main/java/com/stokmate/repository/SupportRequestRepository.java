package com.stokmate.repository;

import com.stokmate.domain.RequestStatus;
import com.stokmate.domain.SupportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {

    @Query("SELECT sr FROM SupportRequest sr LEFT JOIN FETCH sr.createdBy LEFT JOIN FETCH sr.assignedTo WHERE sr.createdBy.id = :userId ORDER BY sr.createdAt DESC")
    List<SupportRequest> findByCreatedByIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT sr FROM SupportRequest sr LEFT JOIN FETCH sr.createdBy LEFT JOIN FETCH sr.assignedTo ORDER BY sr.createdAt DESC")
    List<SupportRequest> findAllOrderByCreatedAtDesc();

    @Query("SELECT sr FROM SupportRequest sr LEFT JOIN FETCH sr.createdBy LEFT JOIN FETCH sr.assignedTo WHERE sr.status = :status ORDER BY sr.createdAt DESC")
    List<SupportRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    @Query("SELECT COUNT(sr) FROM SupportRequest sr WHERE sr.status = 'OPEN'")
    long countOpenRequests();
}
