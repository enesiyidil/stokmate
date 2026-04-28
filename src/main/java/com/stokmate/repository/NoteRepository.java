package com.stokmate.repository;

import com.stokmate.domain.LinkedEntityType;
import com.stokmate.domain.Note;
import com.stokmate.domain.NotePriority;
import com.stokmate.domain.NoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {

        @Query(value = "SELECT * FROM notes n WHERE n.user_id = :userId " +
                        "AND (CAST(:searchTerm AS varchar) IS NULL OR LOWER(n.title::varchar) LIKE LOWER('%' || CAST(:searchTerm AS varchar) || '%') OR LOWER(n.content::varchar) LIKE LOWER('%' || CAST(:searchTerm AS varchar) || '%')) "
                        +
                        "AND (CAST(:priority AS varchar) IS NULL OR n.priority = CAST(:priority AS varchar)) " +
                        "AND (CAST(:status AS varchar) IS NULL OR n.status = CAST(:status AS varchar)) " +
                        "AND (:tagCount = 0 OR n.id IN (" +
                        "    SELECT nt.note_id FROM note_tags nt " +
                        "    WHERE nt.tag IN (:tags) " +
                        "    GROUP BY nt.note_id " +
                        "    HAVING COUNT(DISTINCT nt.tag) = :tagCount" +
                        "))", countQuery = "SELECT COUNT(*) FROM notes n WHERE n.user_id = :userId "
                                        +
                                        "AND (CAST(:searchTerm AS varchar) IS NULL OR LOWER(n.title::varchar) LIKE LOWER('%' || CAST(:searchTerm AS varchar) || '%') OR LOWER(n.content::varchar) LIKE LOWER('%' || CAST(:searchTerm AS varchar) || '%')) "
                                        +
                                        "AND (CAST(:priority AS varchar) IS NULL OR n.priority = CAST(:priority AS varchar)) "
                                        +
                                        "AND (CAST(:status AS varchar) IS NULL OR n.status = CAST(:status AS varchar)) " +
                                        "AND (:tagCount = 0 OR n.id IN (" +
                                        "    SELECT nt.note_id FROM note_tags nt " +
                                        "    WHERE nt.tag IN (:tags) " +
                                        "    GROUP BY nt.note_id " +
                                        "    HAVING COUNT(DISTINCT nt.tag) = :tagCount" +
                                        "))", nativeQuery = true)
        Page<Note> findUserNotesWithFilters(
                        @Param("userId") UUID userId,
                        @Param("searchTerm") String searchTerm,
                        @Param("priority") String priority,
                        @Param("status") String status,
                        @Param("tags") List<String> tags,
                        @Param("tagCount") int tagCount,
                        Pageable pageable);

        @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND n.linkedEntityType = :linkedEntityType AND n.linkedEntityId = :linkedEntityId ORDER BY n.createdAt DESC")
        List<Note> findLinkedNotes(
                        @Param("userId") UUID userId,
                        @Param("linkedEntityType") LinkedEntityType linkedEntityType,
                        @Param("linkedEntityId") String linkedEntityId);
}
