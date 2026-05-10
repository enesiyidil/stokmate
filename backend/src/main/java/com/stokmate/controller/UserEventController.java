package com.stokmate.controller;

import com.stokmate.dto.event.UserEventRequest;
import com.stokmate.dto.event.UserEventResponse;
import com.stokmate.service.UserEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.stokmate.security.UserPrincipal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class UserEventController {

    private final UserEventService userEventService;
    private final com.stokmate.service.ShipmentService shipmentService;

    @GetMapping
    public ResponseEntity<List<UserEventResponse>> getEvents(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<UserEventResponse> events = userEventService.getUserEvents(principal.getUser(), start, end);
        try {
            List<UserEventResponse> shipmentEvents = shipmentService.getCalendarEvents(principal.getUser(), start, end);
            events.addAll(shipmentEvents);
        } catch (Exception e) {
            // Log but don't fail entire request? Or fail?
            // Better to fail if critical, or log error. For now, let it bubble up if valid
            // error,
            // but ensuring list is modifiable (ArrayList).
            // userEventService.getUserEvents returns List from
            // stream.collect(Collectors.toList()) which is mutable ArrayList.
        }
        return ResponseEntity.ok(events);
    }

    @PostMapping
    public ResponseEntity<UserEventResponse> createEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UserEventRequest request) {
        return ResponseEntity.ok(userEventService.createEvent(principal.getUser(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserEventResponse> updateEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody UserEventRequest request) {
        return ResponseEntity.ok(userEventService.updateEvent(principal.getUser(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        userEventService.deleteEvent(principal.getUser(), id);
        return ResponseEntity.noContent().build();
    }
}
