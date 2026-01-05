package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PendingActionService {

    private final PendingActionRepository pendingActionRepository;
    private final VehicleRepository vehicleRepository;
    private final StoreRepository storeRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    /**
     * Create a pending action for a delete operation
     */
    @Transactional
    public PendingAction createPendingAction(ActionType actionType, String entityType,
            UUID entityId, User requestedBy,
            Map<String, Object> actionData) {
        PendingAction action = new PendingAction();
        action.setActionType(actionType);
        action.setEntityType(entityType);
        action.setEntityId(entityId);
        action.setRequestedBy(requestedBy);
        action.setRequestedAt(Instant.now());
        action.setStatus(ActionStatus.PENDING);
        action.setActionData(actionData);

        return pendingActionRepository.save(action);
    }

    /**
     * Get all pending actions
     */
    public List<PendingAction> getAllPendingActions() {
        return pendingActionRepository.findByStatusOrderByRequestedAtDesc(ActionStatus.PENDING);
    }

    /**
     * Get all actions (pending, approved, rejected)
     */
    public List<PendingAction> getAllActions() {
        return pendingActionRepository.findAll();
    }

    /**
     * Approve a pending action and execute it
     */
    @Transactional
    public void approveAction(UUID actionId, User reviewedBy, String reviewNotes) {
        PendingAction action = pendingActionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Pending action not found"));

        if (action.getStatus() != ActionStatus.PENDING) {
            throw new RuntimeException("Action is not pending");
        }

        action.setStatus(ActionStatus.APPROVED);
        action.setReviewedBy(reviewedBy);
        action.setReviewedAt(Instant.now());
        action.setReviewNotes(reviewNotes);
        pendingActionRepository.save(action);

        // Execute the approved action
        executeAction(action);
    }

    /**
     * Reject a pending action
     */
    @Transactional
    public void rejectAction(UUID actionId, User reviewedBy, String reviewNotes) {
        PendingAction action = pendingActionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Pending action not found"));

        if (action.getStatus() != ActionStatus.PENDING) {
            throw new RuntimeException("Action is not pending");
        }

        action.setStatus(ActionStatus.REJECTED);
        action.setReviewedBy(reviewedBy);
        action.setReviewedAt(Instant.now());
        action.setReviewNotes(reviewNotes);
        pendingActionRepository.save(action);

        // For rejected delete operations, restore the entity
        restoreEntity(action);
    }

    /**
     * Execute an approved action
     */
    private void executeAction(PendingAction action) {
        switch (action.getActionType()) {
            case DELETE_VEHICLE -> {
                vehicleRepository.findById(action.getEntityId()).ifPresent(vehicle -> {
                    vehicle.setDeleted(true);
                    vehicle.setDeletionDate(Instant.now());
                    vehicleRepository.save(vehicle);
                });
            }
            case DELETE_STORE -> {
                // Store uses String ID
                storeRepository.findById(action.getEntityId().toString()).ifPresent(store -> {
                    // Store entity directly deletes, no soft delete
                    storeRepository.delete(store);
                });
            }
            case DELETE_CUSTOMER -> {
                customerRepository.findById(action.getEntityId()).ifPresent(customer -> {
                    customer.setDeleted(true);
                    customer.setDeletionDate(Instant.now());
                    customerRepository.save(customer);
                });
            }
            case CANCEL_ORDER -> {
                orderRepository.findById(action.getEntityId()).ifPresent(order -> {
                    order.setStatus(OrderStatus.IPTAL_EDILDI);
                    orderRepository.save(order);
                });
            }
        }
    }

    /**
     * Restore entity for rejected delete actions
     */
    private void restoreEntity(PendingAction action) {
        switch (action.getActionType()) {
            case DELETE_VEHICLE -> {
                vehicleRepository.findById(action.getEntityId()).ifPresent(vehicle -> {
                    vehicle.setDeleted(false);
                    vehicle.setDeletionDate(null);
                    vehicleRepository.save(vehicle);
                });
            }
            case DELETE_STORE -> {
                // Store was not actually deleted yet (pending), so nothing to restore
                // since it's still in database
            }
            case DELETE_CUSTOMER -> {
                customerRepository.findById(action.getEntityId()).ifPresent(customer -> {
                    customer.setDeleted(false);
                    customer.setDeletionDate(null);
                    customerRepository.save(customer);
                });
            }
        }
    }

    /**
     * Check if there's a pending action for an entity
     */
    public boolean hasPendingAction(UUID entityId) {
        return !pendingActionRepository.findByEntityIdAndStatus(entityId, ActionStatus.PENDING).isEmpty();
    }
}
