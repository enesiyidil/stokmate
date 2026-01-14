package com.stokmate.service;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderNote;
import com.stokmate.domain.User;
import com.stokmate.dto.order.CreateOrderNoteRequest;
import com.stokmate.dto.order.OrderNoteResponse;
import com.stokmate.exception.NotFoundException;
import com.stokmate.repository.OrderNoteRepository;
import com.stokmate.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNoteService {

    private final OrderNoteRepository orderNoteRepository;
    private final OrderRepository orderRepository;
    private final OrderActivityService orderActivityService;

    @Transactional
    public OrderNoteResponse addNote(UUID orderId, CreateOrderNoteRequest request, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Sipariş bulunamadı"));

        OrderNote note = new OrderNote();
        note.setOrder(order);
        note.setContent(request.getContent());
        note.setCreatedBy(user);
        note.setCreatedAt(LocalDateTime.now());
        note.setStrikethrough(false);

        OrderNote saved = orderNoteRepository.save(note);

        // Log activity
        orderActivityService.logNoteAdded(order, user, request.getContent());

        log.info("Note added to order {} by user {}", orderId, user.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public OrderNoteResponse strikeNote(UUID noteId, User user) {
        OrderNote note = orderNoteRepository.findById(noteId)
                .orElseThrow(() -> new NotFoundException("Not bulunamadı"));

        if (note.isStrikethrough()) {
            throw new IllegalStateException("Bu notun üstü zaten çizili");
        }

        note.setStrikethrough(true);
        note.setStrikethroughBy(user);
        note.setStrikethroughAt(LocalDateTime.now());

        OrderNote saved = orderNoteRepository.save(note);

        // Log activity
        orderActivityService.logNoteStrikethrough(note.getOrder(), user, note.getContent());

        log.info("Note {} strikethrough by user {}", noteId, user.getEmail());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderNoteResponse> getNotesByOrderId(UUID orderId) {
        List<OrderNote> notes = orderNoteRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        return notes.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private OrderNoteResponse toResponse(OrderNote note) {
        String createdByName = getUserDisplayName(note.getCreatedBy());
        String strikethroughByName = note.getStrikethroughBy() != null
                ? getUserDisplayName(note.getStrikethroughBy())
                : null;

        return OrderNoteResponse.builder()
                .id(note.getId().toString())
                .content(note.getContent())
                .strikethrough(note.isStrikethrough())
                .createdByName(createdByName)
                .createdByEmail(note.getCreatedBy().getEmail())
                .createdAt(note.getCreatedAt())
                .strikethroughByName(strikethroughByName)
                .strikethroughAt(note.getStrikethroughAt())
                .build();
    }

    private String getUserDisplayName(User user) {
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        }
        return user.getEmail().split("@")[0];
    }
}
