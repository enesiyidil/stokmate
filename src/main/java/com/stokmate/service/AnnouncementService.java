package com.stokmate.service;

import com.stokmate.domain.Announcement;
import com.stokmate.domain.User;
import com.stokmate.dto.announcement.AnnouncementRequest;
import com.stokmate.dto.announcement.AnnouncementResponse;
import com.stokmate.mapper.AnnouncementMapper;
import com.stokmate.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementMapper announcementMapper;

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getActiveAnnouncements() {
        return announcementRepository.findAllByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(announcementMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(AnnouncementRequest request, User creator) {
        Announcement announcement = Announcement.builder()
                .content(request.getContent())
                .createdBy(creator)
                .isActive(true)
                .build();

        Announcement saved = announcementRepository.save(announcement);
        return announcementMapper.toResponse(saved);
    }

    @Transactional
    public void deleteAnnouncement(UUID id) {
        announcementRepository.findById(id).ifPresent(announcement -> {
            announcement.setActive(false);
            announcementRepository.save(announcement);
        });
    }
}
