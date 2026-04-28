package com.stokmate.service;

import com.stokmate.domain.LinkedEntityType;
import com.stokmate.domain.Note;
import com.stokmate.domain.NoteItem;
import com.stokmate.domain.NotePriority;
import com.stokmate.domain.NoteStatus;
import com.stokmate.domain.NoteTag;
import com.stokmate.domain.User;
import com.stokmate.dto.NoteDto;
import com.stokmate.mapper.NoteMapper;
import com.stokmate.repository.NoteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteMapper noteMapper;
    private final AuthService authService; // Assuming authService to get current user

    @Transactional(readOnly = true)
    public Page<NoteDto> getUserNotes(
            String searchTerm,
            NotePriority priority,
            NoteStatus status,
            List<NoteTag> tags,
            Pageable pageable) {
        User currentUser = authService.getCurrentUserOrThrow();
        String priorityStr = priority != null ? priority.name() : null;
        String statusStr = status != null ? status.name() : null;
        List<String> tagNames = (tags == null || tags.isEmpty())
                ? java.util.List.of("__NO_TAG_FILTER__")
                : tags.stream().map(NoteTag::name).toList();
        int tagCount = tags != null ? tags.size() : 0;
        return noteRepository
                .findUserNotesWithFilters(currentUser.getId(), searchTerm, priorityStr, statusStr, tagNames, tagCount,
                        pageable)
                .map(noteMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<NoteDto> getLinkedNotes(LinkedEntityType type, String entityId) {
        User currentUser = authService.getCurrentUserOrThrow();
        return noteRepository.findLinkedNotes(currentUser.getId(), type, entityId).stream()
                .map(noteMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoteDto getNote(UUID id) {
        Note note = getNoteEntity(id);
        return noteMapper.toDto(note);
    }

    @Transactional
    public NoteDto createNote(NoteDto dto) {
        User currentUser = authService.getCurrentUserOrThrow();
        Note note = noteMapper.toEntity(dto);
        note.setUser(currentUser);

        if (dto.getItems() != null) {
            dto.getItems().forEach(itemDto -> {
                NoteItem item = noteMapper.toItemEntity(itemDto);
                note.addItem(item);
            });
        }

        Note saved = noteRepository.save(note);
        return noteMapper.toDto(saved);
    }

    @Transactional
    public NoteDto updateNote(UUID id, NoteDto dto) {
        Note existing = getNoteEntity(id);

        existing.setTitle(dto.getTitle());
        existing.setContent(dto.getContent());
        existing.setNoteType(dto.getNoteType());
        existing.setPriority(dto.getPriority());
        existing.setStatus(dto.getStatus());
        existing.setTags(dto.getTags());
        existing.setLinkedEntityType(dto.getLinkedEntityType());
        existing.setLinkedEntityId(dto.getLinkedEntityId());
        existing.setColor(dto.getColor());

        existing.getItems().clear();
        if (dto.getItems() != null) {
            dto.getItems().forEach(itemDto -> {
                NoteItem item = noteMapper.toItemEntity(itemDto);
                existing.addItem(item);
            });
        }

        return noteMapper.toDto(noteRepository.save(existing));
    }

    @Transactional
    public void deleteNote(UUID id) {
        Note note = getNoteEntity(id);
        noteRepository.delete(note);
    }

    @Transactional
    public NoteDto toggleItemCompletion(UUID noteId, Long itemId) {
        Note note = getNoteEntity(noteId);
        NoteItem itemToToggle = note.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Note item not found"));

        itemToToggle.setCompleted(!itemToToggle.isCompleted());
        return noteMapper.toDto(noteRepository.save(note));
    }

    private Note getNoteEntity(UUID id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Note not found"));

        User currentUser = authService.getCurrentUserOrThrow();
        if (!note.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You don't have permission to access this note");
        }

        return note;
    }
}
