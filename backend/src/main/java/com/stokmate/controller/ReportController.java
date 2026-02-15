package com.stokmate.controller;

import com.stokmate.dto.report.*;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Reports")
public class ReportController {

  private final ReportService reportService;

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
  @PostMapping("/order")
  @Operation(summary = "Generate order report", description = "Generates an order report PDF with filters for date range, consultants, and brands")
  public ReportResponse generateOrderReport(
      @Valid @RequestBody GenerateOrderReportRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    log.info("Generating order report: {} to {}", request.getStartDate(), request.getEndDate());
    return reportService.generateOrderReport(request, principal.getUser());
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
  @PostMapping("/stock-sale")
  @Operation(summary = "Generate stock sale report", description = "Generates a stock sale report PDF with cost/profit analysis")
  public ReportResponse generateStockSaleReport(
      @Valid @RequestBody GenerateStockSaleReportRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    log.info("Generating stock sale report: {} to {}", request.getStartDate(), request.getEndDate());
    return reportService.generateStockSaleReport(request, principal.getUser());
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
  @PostMapping("/shipment")
  @Operation(summary = "Generate shipment report", description = "Generates a shipment report PDF with timeline and status analysis")
  public ReportResponse generateShipmentReport(
      @Valid @RequestBody GenerateShipmentReportRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    log.info("Generating shipment report: {} to {}", request.getStartDate(), request.getEndDate());
    return reportService.generateShipmentReport(request, principal.getUser());
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
  @GetMapping
  @Operation(summary = "List all reports", description = "Returns all generated reports, optionally filtered by type")
  public List<ReportResponse> listReports(
      @RequestParam(value = "type", required = false) String type) {
    return reportService.listReports(type);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
  @GetMapping("/{reportId}")
  @Operation(summary = "Get report details", description = "Returns report metadata by ID")
  public ReportResponse getReport(@PathVariable UUID reportId) {
    return reportService.getReport(reportId);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR')")
  @GetMapping("/{reportId}/download")
  @Operation(summary = "Download report PDF", description = "Downloads the generated report PDF file")
  public ResponseEntity<InputStreamResource> downloadReport(@PathVariable UUID reportId) {
    ReportResponse report = reportService.getReport(reportId);
    InputStream is = reportService.downloadReportPdf(reportId);

    String filename = report.getReportNo() + ".pdf";
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .body(new InputStreamResource(is));
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @DeleteMapping("/{reportId}")
  @Operation(summary = "Delete report", description = "Permanently deletes a report and its PDF file")
  public ResponseEntity<Void> deleteReport(@PathVariable UUID reportId) {
    reportService.deleteReport(reportId);
    return ResponseEntity.ok().build();
  }
}
