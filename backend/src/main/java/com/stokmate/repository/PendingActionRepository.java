package com.stokmate.repository;

import com.stokmate.domain.ActionStatus;
import com.stokmate.domain.ActionType;
import com.stokmate.domain.PendingAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PendingActionRepository extends JpaRepository<PendingAction, UUID> {

    List<PendingAction> findByStatus(ActionStatus status);

    List<PendingAction> findByStatusOrderByRequestedAtDesc(ActionStatus status);

    List<PendingAction> findByActionTypeAndStatus(ActionType actionType, ActionStatus status);

    List<PendingAction> findByEntityIdAndStatus(UUID entityId, ActionStatus status);
}
