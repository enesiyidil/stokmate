package com.stokmate.controller;

import com.stokmate.dto.order.CreateOrderNoteRequest;
import com.stokmate.dto.order.OrderNoteResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.OrderNoteService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class OrderNoteController {

    private final OrderNoteService orderNoteService;

    @GetMapping("/{orderId}/notes")
    public ResponseEntity<List<OrderNoteResponse>> getNotes(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderNoteService.getNotesByOrderId(orderId));
    }

    @PostMapping("/{orderId}/notes")
    public ResponseEntity<OrderNoteResponse> addNote(
            @PathVariable UUID orderId,
            @Valid @RequestBody CreateOrderNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderNoteResponse response = orderNoteService.addNote(orderId, request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{orderId}/notes/{noteId}/strike")
    public ResponseEntity<OrderNoteResponse> strikeNote(
            @PathVariable UUID orderId,
            @PathVariable UUID noteId,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderNoteResponse response = orderNoteService.strikeNote(noteId, principal.getUser());
        return ResponseEntity.ok(response);
    }
}
