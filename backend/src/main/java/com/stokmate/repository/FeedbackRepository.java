package com.stokmate.repository;

import com.stokmate.domain.Feedback;
import com.stokmate.domain.FeedbackStatus;
import com.stokmate.domain.FeedbackType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    @Query("SELECT f FROM Feedback f LEFT JOIN FETCH f.createdBy WHERE f.createdBy.id = :userId ORDER BY f.createdAt DESC")
    List<Feedback> findByCreatedByIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT f FROM Feedback f LEFT JOIN FETCH f.createdBy ORDER BY f.createdAt DESC")
    List<Feedback> findAllOrderByCreatedAtDesc();

    @Query("SELECT f FROM Feedback f LEFT JOIN FETCH f.createdBy WHERE f.status = :status ORDER BY f.createdAt DESC")
    List<Feedback> findByStatusOrderByCreatedAtDesc(FeedbackStatus status);

    @Query("SELECT f FROM Feedback f LEFT JOIN FETCH f.createdBy WHERE f.type = :type ORDER BY f.createdAt DESC")
    List<Feedback> findByTypeOrderByCreatedAtDesc(FeedbackType type);

    @Query("SELECT f FROM Feedback f LEFT JOIN FETCH f.createdBy WHERE f.status = :status AND f.type = :type ORDER BY f.createdAt DESC")
    List<Feedback> findByStatusAndTypeOrderByCreatedAtDesc(FeedbackStatus status, FeedbackType type);

    @Query("SELECT f FROM Feedback f LEFT JOIN FETCH f.createdBy WHERE f.id = :id")
    Optional<Feedback> findByIdWithCreatedBy(UUID id);

    long countByStatus(FeedbackStatus status);

    long countByType(FeedbackType type);
}
