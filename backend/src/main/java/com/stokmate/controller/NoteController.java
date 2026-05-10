package com.stokmate.controller;

import com.stokmate.domain.LinkedEntityType;
import com.stokmate.domain.NotePriority;
import com.stokmate.domain.NoteStatus;
import com.stokmate.domain.NoteTag;
import com.stokmate.dto.NoteDto;
import com.stokmate.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<Page<NoteDto>> getUserNotes(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) NotePriority priority,
            @RequestParam(required = false) NoteStatus status,
            @RequestParam(required = false) List<NoteTag> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(noteService.getUserNotes(searchTerm, priority, status, tags, pageable));
    }

    @GetMapping("/linked/{type}/{id}")
    public ResponseEntity<List<NoteDto>> getLinkedNotes(
            @PathVariable LinkedEntityType type,
            @PathVariable String id) {
        return ResponseEntity.ok(noteService.getLinkedNotes(type, id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteDto> getNote(@PathVariable UUID id) {
        return ResponseEntity.ok(noteService.getNote(id));
    }

    @PostMapping
    public ResponseEntity<NoteDto> createNote(@RequestBody NoteDto noteDto) {
        return ResponseEntity.ok(noteService.createNote(noteDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDto> updateNote(
            @PathVariable UUID id,
            @RequestBody NoteDto noteDto) {
        return ResponseEntity.ok(noteService.updateNote(id, noteDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID id) {
        noteService.deleteNote(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{noteId}/items/{itemId}/toggle")
    public ResponseEntity<NoteDto> toggleItemCompletion(
            @PathVariable UUID noteId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(noteService.toggleItemCompletion(noteId, itemId));
    }
}
