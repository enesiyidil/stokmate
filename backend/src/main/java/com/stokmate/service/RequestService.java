package com.stokmate.service;

import com.stokmate.domain.RequestTicket;
import com.stokmate.domain.User;
import com.stokmate.dto.request.RequestCreateRequest;
import com.stokmate.dto.request.RequestResponse;
import com.stokmate.dto.request.RequestStatusUpdateRequest;
import com.stokmate.exception.NotFoundException;
import com.stokmate.repository.RequestTicketRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestTicketRepository repository;

    public RequestResponse create(RequestCreateRequest request, User owner) {
        RequestTicket ticket = new RequestTicket();
        ticket.setType(request.getType());
        ticket.setMessage(request.getMessage());
        ticket.setOwner(owner);
        RequestTicket saved = repository.save(ticket);
        return toResponse(saved);
    }

    @Transactional
    public List<RequestResponse> listOwn(User owner) {
        return repository.findByOwnerId(owner.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public List<RequestResponse> listAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public RequestResponse updateStatus(UUID id, RequestStatusUpdateRequest request) {
        RequestTicket ticket = repository.findById(id).orElseThrow(() -> new NotFoundException("Request not found"));
        ticket.setStatus(request.getStatus());
        return toResponse(ticket);
    }

    private RequestResponse toResponse(RequestTicket ticket) {
        return RequestResponse.builder()
                .id(ticket.getId())
                .message(ticket.getMessage())
                .status(ticket.getStatus())
                .type(ticket.getType())
                .ownerId(ticket.getOwner().getId())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
