package com.stokmate.repository;

import com.stokmate.domain.FeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackResponseRepository extends JpaRepository<FeedbackResponse, UUID> {

    @Query("SELECT fr FROM FeedbackResponse fr LEFT JOIN FETCH fr.createdBy WHERE fr.feedback.id = :feedbackId ORDER BY fr.createdAt ASC")
    List<FeedbackResponse> findByFeedbackIdOrderByCreatedAtAsc(UUID feedbackId);

    long countByFeedbackId(UUID feedbackId);
}
