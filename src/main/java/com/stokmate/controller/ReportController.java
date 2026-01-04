/*
 * package com.stokmate.controller;
 * 
 * import com.stokmate.dto.report.SalesReportResponse;
 * import com.stokmate.service.ReportService;
 * import io.swagger.v3.oas.annotations.security.SecurityRequirement;
 * import java.time.LocalDate;
 * import lombok.RequiredArgsConstructor;
 * import org.springframework.data.domain.PageRequest;
 * import org.springframework.security.access.prepost.PreAuthorize;
 * import org.springframework.web.bind.annotation.GetMapping;
 * import org.springframework.web.bind.annotation.RequestMapping;
 * import org.springframework.web.bind.annotation.RequestParam;
 * import org.springframework.web.bind.annotation.RestController;
 * 
 * // Temporarily disabled - Sale entities not yet implemented
 * /*
 * 
 * @RestController
 * 
 * @RequestMapping("/api/reports")
 * 
 * @RequiredArgsConstructor
 * 
 * @SecurityRequirement(name = "bearerAuth")
 * public class ReportController {
 * 
 * private final ReportService reportService;
 * 
 * @PreAuthorize("hasRole('ADMIN')")
 * 
 * @GetMapping("/sales")
 * public SalesReportResponse sales(@RequestParam(required = false) LocalDate
 * start,
 * 
 * @RequestParam(required = false) LocalDate end,
 * 
 * @RequestParam(defaultValue = "0") int page,
 * 
 * @RequestParam(defaultValue = "20") int size) {
 * return reportService.salesReport(start, end, PageRequest.of(page, size));
 * }
 * }
 *//*
   */
