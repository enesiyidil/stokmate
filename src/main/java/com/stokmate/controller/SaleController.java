package com.stokmate.controller;

import com.stokmate.domain.SaleStatus;
import com.stokmate.dto.sale.SaleEventResponse;
import com.stokmate.dto.sale.SaleRequest;
import com.stokmate.dto.sale.SaleResponse;
import com.stokmate.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.stokmate.security.UserPrincipal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sale management endpoints")
public class SaleController {

  private final SaleService saleService;

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN')")
  @Operation(summary = "Create new sale")
  public SaleResponse create(@RequestBody SaleRequest request, @AuthenticationPrincipal UserPrincipal principal) {
    return saleService.create(request, principal.getUser());
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN')")
  @Operation(summary = "List sales with filters")
  public List<SaleResponse> list(
      @RequestParam(name = "status", required = false) SaleStatus status,
      @RequestParam(name = "consultantId", required = false) UUID consultantId) {
    return saleService.list(status, consultantId);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN')")
  @Operation(summary = "Get sale details")
  public SaleResponse getById(@PathVariable("id") UUID id) {
    return saleService.getById(id);
  }

  @PutMapping("/{id}/status")
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN')")
  @Operation(summary = "Update sale status")
  public SaleResponse updateStatus(
      @PathVariable("id") UUID id,
      @RequestParam("status") SaleStatus status,
      @AuthenticationPrincipal UserPrincipal principal) {
    return saleService.updateStatus(id, status, principal.getUser());
  }

  @PostMapping(value = "/{id}/contract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN')")
  @Operation(summary = "Upload contract file")
  public SaleResponse uploadContract(
      @PathVariable("id") UUID id,
      @RequestParam("file") MultipartFile file,
      @AuthenticationPrincipal UserPrincipal principal) {
    return saleService.uploadContract(id, file, principal.getUser());
  }

  @DeleteMapping("/{id}/contract")
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR')")
  @Operation(summary = "Delete contract file")
  public void deleteContract(@PathVariable("id") UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    saleService.deleteContract(id, principal.getUser());
  }

  @GetMapping("/{id}/events")
  @PreAuthorize("hasAnyRole('ADMIN', 'MUDUR', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN')")
  @Operation(summary = "Get sale event history")
  public List<SaleEventResponse> getEvents(@PathVariable("id") UUID id) {
    return saleService.getEvents(id);
  }
}
