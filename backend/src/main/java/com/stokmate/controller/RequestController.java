package com.stokmate.controller;

import com.stokmate.dto.request.RequestCreateRequest;
import com.stokmate.dto.request.RequestResponse;
import com.stokmate.dto.request.RequestStatusUpdateRequest;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.RequestService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class RequestController {

    private final RequestService requestService;

    @PreAuthorize("hasAnyRole('MAGAZA_CALISAN','MAGAZA_SORUMLU')")
    @PostMapping
    public RequestResponse create(@Valid @RequestBody RequestCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return requestService.create(request, principal.getUser());
    }

    @PreAuthorize("hasAnyRole('MAGAZA_CALISAN','MAGAZA_SORUMLU')")
    @GetMapping
    public List<RequestResponse> listOwn(@AuthenticationPrincipal UserPrincipal principal) {
        return requestService.listOwn(principal.getUser());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<RequestResponse> listAll() {
        return requestService.listAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public RequestResponse updateStatus(@PathVariable UUID id,
            @Valid @RequestBody RequestStatusUpdateRequest request) {
        return requestService.updateStatus(id, request);
    }
}
