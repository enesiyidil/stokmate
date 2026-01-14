package com.stokmate.repository;

import com.stokmate.domain.UserEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserEventRepository extends JpaRepository<UserEvent, UUID> {

    // Find events for a specific user within a date range (for calendar view)
    @Query("SELECT e FROM UserEvent e WHERE e.user.id = :userId AND " +
            "((e.startDateTime BETWEEN :start AND :end) OR (e.endDateTime BETWEEN :start AND :end))")
    List<UserEvent> findByUserAndDateRange(UUID userId, LocalDateTime start, LocalDateTime end);

    // Find events that need notification (not yet notified, and trigger time is
    // passed)
    // We'll handle the "trigger time" logic in the Service via standard find
    // criteria + calculation
    // OR we can do a complex query here. Simple approach: fetch un-notified events
    // with reminder != NONE
    @Query("SELECT e FROM UserEvent e WHERE e.isNotified = false AND e.reminderType != 'NONE'")
    List<UserEvent> findPotentialReminders();

    List<UserEvent> findByUserId(UUID userId);
}
