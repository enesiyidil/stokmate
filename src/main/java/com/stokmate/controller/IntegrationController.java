package com.stokmate.controller;

import com.stokmate.dto.integration.WhatsappQueryRequest;
import com.stokmate.dto.integration.WhatsappQueryResponse;
import com.stokmate.service.WhatsappService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integrations/whatsapp")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class IntegrationController {

    private final WhatsappService whatsappService;

    @PreAuthorize("hasAnyRole('ADMIN','USER','DEPO')")
    @PostMapping("/query")
    public WhatsappQueryResponse query(@Valid @RequestBody WhatsappQueryRequest request) {
        return whatsappService.query(request);
    }
}
