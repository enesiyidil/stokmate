package com.stokmate.service;

import com.stokmate.domain.DeliverySession;
import com.stokmate.dto.delivery.DeliveryCompletionRequest;
import com.stokmate.dto.delivery.DeliverySessionResponse;
import com.stokmate.dto.shipment.ShipmentCompletionRequest;
import com.stokmate.dto.shipment.ShipmentDetailsResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.repository.DeliverySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliverySessionService {

    private final DeliverySessionRepository deliverySessionRepository;
    private final ShipmentService shipmentService;

    public DeliverySession createSession(UUID shipmentId) {
        // Check if active session exists
        // Optional: Invalidate old sessions or reuse?
        // For now create new.

        DeliverySession session = new DeliverySession();
        session.setShipmentId(shipmentId);
        session.setToken(UUID.randomUUID().toString()); // Use UUID as token for now
        session.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS)); // 7 days expiry
        session.setCompleted(false);

        return deliverySessionRepository.save(session);
    }

    public DeliverySessionResponse validateSession(String token) {
        DeliverySession session = deliverySessionRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (session.isCompleted()) {
            // Alternatively return response with completed=true
            ShipmentDetailsResponse details = shipmentService.getShipmentDetailsByShipmentId(session.getShipmentId());
            return toSessionResponse(details, session);
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Session expired");
        }

        ShipmentDetailsResponse details = shipmentService.getShipmentDetailsByShipmentId(session.getShipmentId());
        return toSessionResponse(details, session);
    }

    @Transactional
    public void completeSession(String token, DeliveryCompletionRequest request, UUID userId) throws Exception {
        DeliverySession session = deliverySessionRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (session.isCompleted()) {
            throw new BadRequestException("Session already completed");
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Session expired");
        }

        // Map request to ShipmentCompletionRequest
        ShipmentCompletionRequest shipmentRequest = ShipmentCompletionRequest.builder()
                .shipmentId(session.getShipmentId())
                .deliveryStatus(request.getDeliveryStatus())
                .problemType(request.getProblemType())
                .deliveryNotes(request.getDeliveryNotes())
                .signedDocument(request.getSignedDocument())
                .deliveryPhotos(request.getDeliveryPhotos())
                .receiverName(request.getReceiverName())
                .actualShipmentDate(request.getDeliveredAt())
                .build();

        shipmentService.completeShipment(shipmentRequest, userId);

        session.setCompleted(true);
        deliverySessionRepository.save(session);
    }

    // Check if session exists for shipment, if so return it, otherwise create
    public DeliverySession getOrCreateSession(UUID shipmentId) {
        return deliverySessionRepository.findByShipmentId(shipmentId)
                .filter(s -> s.getExpiresAt().isAfter(Instant.now()) && !s.isCompleted())
                .orElseGet(() -> createSession(shipmentId));
    }

    private DeliverySessionResponse toSessionResponse(ShipmentDetailsResponse details, DeliverySession session) {
        List<DeliverySessionResponse.DeliveryProductInfo> products = details.getProducts().stream()
                .map(p -> DeliverySessionResponse.DeliveryProductInfo.builder()
                        .name(p.getProductName())
                        .code(p.getProductCode())
                        .quantity(p.getPendingQuantity()) // The quantity in this shipment
                        .build())
                .collect(Collectors.toList());

        String customerName = "Unknown";
        String customerAddress = "";
        String customerPhone = "";

        if (details.getCustomer() != null) {
            customerName = details.getCustomer().getName();
            customerAddress = details.getCustomer().getAddress();
            customerPhone = details.getCustomer().getPhone();
        }

        return DeliverySessionResponse.builder()
                .shipmentId(UUID.fromString(details.getShipmentId()))
                .customerName(customerName)
                .customerAddress(customerAddress)
                .customerPhone(customerPhone)
                .products(products)
                .completed(session.isCompleted())
                .build();
    }
}
