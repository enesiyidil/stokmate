package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.report.*;
import com.stokmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final OrderRepository orderRepository;
    private final SaleRepository saleRepository;
    private final ShipmentRepository shipmentRepository;
    private final ProductPriceHistoryRepository priceHistoryRepository;
    private final StorageService storageService;

    private static final DateTimeFormatter TR_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TR_DATETIME = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    // =================== PUBLIC API ===================

    @Transactional
    public ReportResponse generateOrderReport(GenerateOrderReportRequest request, User currentUser) {
        Report report = createReportRecord(ReportType.ORDER, request.getStartDate(), request.getEndDate(),
                buildFilterDescription(request.getSalesConsultantIds(), request.getBrands()), currentUser,
                request.getTitle());
        try {
            List<Order> orders = fetchOrdersForReport(request);
            byte[] pdfBytes = generateOrderPdf(orders, report, request);

            String fileKey = "reports/" + report.getReportNo() + ".pdf";
            storageService.upload(fileKey, pdfBytes, "application/pdf");

            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal totalCost = BigDecimal.ZERO;
            for (Order o : orders) {
                for (OrderProduct op : o.getProducts()) {
                    BigDecimal qty = op.getQuantity() != null ? op.getQuantity() : BigDecimal.ONE;
                    BigDecimal net = op.getNetPrice() != null ? op.getNetPrice() : BigDecimal.ZERO;
                    BigDecimal gross = op.getGrossPrice() != null ? op.getGrossPrice() : BigDecimal.ZERO;
                    totalRevenue = totalRevenue.add(net.multiply(qty));
                    totalCost = totalCost.add(gross.multiply(qty));
                }
            }

            report.setPdfFileKey(fileKey);
            report.setTotalRecords(orders.size());
            report.setTotalRevenue(totalRevenue);
            report.setTotalCost(totalCost);
            report.setTotalProfit(totalRevenue.subtract(totalCost));
            report.setStatus(ReportStatus.COMPLETED);
            report.setCompletedAt(LocalDateTime.now());
            reportRepository.save(report);
            return toResponse(report);
        } catch (Exception e) {
            log.error("Order report generation failed", e);
            report.setStatus(ReportStatus.FAILED);
            report.setDescription("Hata: " + e.getMessage());
            reportRepository.save(report);
            throw new RuntimeException("Rapor oluşturulurken hata: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ReportResponse generateStockSaleReport(GenerateStockSaleReportRequest request, User currentUser) {
        Report report = createReportRecord(ReportType.STOCK_SALE, request.getStartDate(), request.getEndDate(),
                buildFilterDescription(request.getSalesConsultantIds(), request.getBrands()), currentUser,
                request.getTitle());
        try {
            List<Sale> sales = fetchSalesForReport(request);
            byte[] pdfBytes = generateStockSalePdf(sales, report, request);

            String fileKey = "reports/" + report.getReportNo() + ".pdf";
            storageService.upload(fileKey, pdfBytes, "application/pdf");

            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal totalCost = BigDecimal.ZERO;
            for (Sale s : sales) {
                totalRevenue = totalRevenue.add(s.getTotalNet() != null ? s.getTotalNet() : BigDecimal.ZERO);
                for (SaleProduct sp : s.getProducts()) {
                    BigDecimal costPrice = findStockCostPrice(sp);
                    totalCost = totalCost.add(costPrice.multiply(BigDecimal.valueOf(sp.getQuantity())));
                }
            }

            report.setPdfFileKey(fileKey);
            report.setTotalRecords(sales.size());
            report.setTotalRevenue(totalRevenue);
            report.setTotalCost(totalCost);
            report.setTotalProfit(totalRevenue.subtract(totalCost));
            report.setStatus(ReportStatus.COMPLETED);
            report.setCompletedAt(LocalDateTime.now());
            reportRepository.save(report);
            return toResponse(report);
        } catch (Exception e) {
            log.error("Stock sale report generation failed", e);
            report.setStatus(ReportStatus.FAILED);
            report.setDescription("Hata: " + e.getMessage());
            reportRepository.save(report);
            throw new RuntimeException("Rapor oluşturulurken hata: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ReportResponse generateShipmentReport(GenerateShipmentReportRequest request, User currentUser) {
        Report report = createReportRecord(ReportType.SHIPMENT, request.getStartDate(), request.getEndDate(),
                "Kapsam: " + (request.getShipmentScope() != null ? request.getShipmentScope() : "ALL"), currentUser,
                request.getTitle());
        try {
            List<Shipment> shipments = fetchShipmentsForReport(request);
            byte[] pdfBytes = generateShipmentPdf(shipments, report, request);

            String fileKey = "reports/" + report.getReportNo() + ".pdf";
            storageService.upload(fileKey, pdfBytes, "application/pdf");

            long finalized = shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.FINALIZED).count();
            report.setPdfFileKey(fileKey);
            report.setTotalRecords(shipments.size());
            report.setTotalRevenue(BigDecimal.valueOf(finalized));
            report.setStatus(ReportStatus.COMPLETED);
            report.setCompletedAt(LocalDateTime.now());
            reportRepository.save(report);
            return toResponse(report);
        } catch (Exception e) {
            log.error("Shipment report generation failed", e);
            report.setStatus(ReportStatus.FAILED);
            report.setDescription("Hata: " + e.getMessage());
            reportRepository.save(report);
            throw new RuntimeException("Rapor oluşturulurken hata: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> listReports(String typeFilter) {
        List<Report> reports;
        if (typeFilter != null && !typeFilter.isBlank() && !typeFilter.equalsIgnoreCase("ALL")) {
            try {
                ReportType rt = ReportType.valueOf(typeFilter);
                reports = reportRepository.findByReportTypeOrderByCreatedAtDesc(rt);
            } catch (Exception e) {
                reports = reportRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            reports = reportRepository.findAllByOrderByCreatedAtDesc();
        }
        return reports.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InputStream downloadReportPdf(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapor bulunamadı"));
        if (report.getPdfFileKey() == null) {
            throw new RuntimeException("Rapor PDF dosyası bulunamadı");
        }
        return storageService.download(report.getPdfFileKey());
    }

    @Transactional(readOnly = true)
    public ReportResponse getReport(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapor bulunamadı"));
        return toResponse(report);
    }

    @Transactional
    public void deleteReport(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapor bulunamadı"));
        if (report.getPdfFileKey() != null) {
            try {
                storageService.delete(report.getPdfFileKey());
            } catch (Exception e) {
                log.warn("Could not delete report PDF from storage: {}", e.getMessage());
            }
        }
        reportRepository.delete(report);
    }

    // =================== DATA FETCHING ===================

    private List<Order> fetchOrdersForReport(GenerateOrderReportRequest request) {
        List<Order> allOrders = orderRepository.findAll();
        return allOrders.stream()
                .filter(o -> o.getOrderType() == OrderType.CUSTOMER_SPECIFIC
                        || o.getOrderType() == OrderType.AFTER_SALES_SERVICE)
                .filter(o -> !o.getOrderDate().isBefore(request.getStartDate())
                        && !o.getOrderDate().isAfter(request.getEndDate()))
                .filter(o -> {
                    if (request.getSalesConsultantIds() != null && !request.getSalesConsultantIds().isEmpty()) {
                        return o.getSalesConsultant() != null
                                && request.getSalesConsultantIds().contains(o.getSalesConsultant().getId());
                    }
                    return true;
                })
                .filter(o -> {
                    if (request.getBrands() != null && !request.getBrands().isEmpty()) {
                        return o.getProducts().stream().anyMatch(
                                p -> p.getBrand() != null && request.getBrands().contains(p.getBrand().name()));
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Order::getOrderDate))
                .collect(Collectors.toList());
    }

    private List<Sale> fetchSalesForReport(GenerateStockSaleReportRequest request) {
        List<Sale> allSales = saleRepository.findAll();
        return allSales.stream()
                .filter(s -> !s.getSaleDate().isBefore(request.getStartDate())
                        && !s.getSaleDate().isAfter(request.getEndDate()))
                .filter(s -> {
                    if (request.getSalesConsultantIds() != null && !request.getSalesConsultantIds().isEmpty()) {
                        return s.getSalesConsultant() != null
                                && request.getSalesConsultantIds().contains(s.getSalesConsultant().getId());
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Sale::getSaleDate))
                .collect(Collectors.toList());
    }

    private List<Shipment> fetchShipmentsForReport(GenerateShipmentReportRequest request) {
        LocalDateTime start = request.getStartDate().atStartOfDay();
        LocalDateTime end = request.getEndDate().atTime(23, 59, 59);
        List<Shipment> all = shipmentRepository.findAllByPlannedShipmentDateBetween(start, end);

        String scope = request.getShipmentScope() != null ? request.getShipmentScope() : "ALL";
        return all.stream()
                .filter(s -> {
                    if ("ORDER".equals(scope))
                        return s.getOrder() != null;
                    if ("SALE".equals(scope))
                        return s.getSale() != null;
                    return true;
                })
                .sorted(Comparator.comparing(s -> s.getCreatedAt() != null ? s.getCreatedAt() : java.time.Instant.MIN))
                .collect(Collectors.toList());
    }

    // =================== PDF GENERATION ===================

    private byte[] generateOrderPdf(List<Order> orders, Report report, GenerateOrderReportRequest request)
            throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDFont font = loadFont(doc);
            float pageWidth = PDRectangle.A4.getHeight(); // Landscape width (842)
            float pageHeight = PDRectangle.A4.getWidth(); // Landscape height (595)
            float margin = 40;
            float usableWidth = pageWidth - 2 * margin;

            // Stats
            long completed = orders.stream().filter(o -> isCompleted(o.getStatus())).count();
            long cancelled = orders.stream().filter(o -> isCancelled(o.getStatus())).count();
            long inProgress = orders.size() - completed - cancelled;
            long withSsh = orders.stream()
                    .filter(o -> o.getOrderType() == OrderType.AFTER_SALES_SERVICE || hasSshChildren(o)).count();

            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal totalCost = BigDecimal.ZERO;
            for (Order o : orders) {
                for (OrderProduct op : o.getProducts()) {
                    BigDecimal qty = op.getQuantity() != null ? op.getQuantity() : BigDecimal.ONE;
                    totalRevenue = totalRevenue
                            .add((op.getNetPrice() != null ? op.getNetPrice() : BigDecimal.ZERO).multiply(qty));
                    totalCost = totalCost
                            .add((op.getGrossPrice() != null ? op.getGrossPrice() : BigDecimal.ZERO).multiply(qty));
                }
            }

            // --- TABLE COLUMNS (auto-expand to fill page) ---
            String[] headers = { "Sipariş No", "Müşteri", "Tarih", "Durum", "Ürün", "Brüt Fiyat", "Net Fiyat", "Kâr",
                    "Süre" };
            float[] colWidths = expandColumns(new float[] { 90, 130, 75, 70, 75, 90, 90, 80, 50 }, usableWidth);

            // --- PAGE 1: Header + Table ---
            PDPage page = new PDPage(new PDRectangle(pageWidth, pageHeight));
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = pageHeight - margin;

            // Compact header
            y = drawCompactHeader(cs, font, "SİPARİŞ RAPORU", report, y, margin);

            // Summary stats (inline, two columns)
            y -= 6;
            cs.setFont(font, 8.5f);
            cs.setNonStrokingColor(new Color(60, 50, 30));
            String statsLeft = "Dönem: " + request.getStartDate().format(TR_DATE) + " - "
                    + request.getEndDate().format(TR_DATE) + "  ·  Toplam: " + orders.size()
                    + "  ·  Tamamlanan: " + completed + "  ·  Devam: " + inProgress + "  ·  İptal: " + cancelled
                    + "  ·  SSH: " + withSsh;
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText(statsLeft);
            cs.endText();
            y -= 13;

            String financial = "Gelir: " + formatMoney(totalRevenue) + " TL  ·  Maliyet: " + formatMoney(totalCost)
                    + " TL  ·  Kâr: " + formatMoney(totalRevenue.subtract(totalCost)) + " TL";
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText(financial);
            cs.endText();
            cs.setNonStrokingColor(Color.BLACK);
            y -= 16;

            // Table header
            y = drawTableHeader(cs, font, headers, colWidths, margin, y);
            int pageNum = 1;

            for (Order order : orders) {
                if (y < 50) {
                    drawPageNumber(cs, font, page, pageNum++);
                    cs.close();
                    page = new PDPage(new PDRectangle(pageWidth, pageHeight));
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = pageHeight - margin;
                    y = drawTableHeader(cs, font, headers, colWidths, margin, y);
                }

                Color rowColor = getOrderRowColor(order);
                BigDecimal orderGross = BigDecimal.ZERO;
                BigDecimal orderNet = BigDecimal.ZERO;
                int productCount = order.getProducts().size();
                for (OrderProduct op : order.getProducts()) {
                    BigDecimal qty = op.getQuantity() != null ? op.getQuantity() : BigDecimal.ONE;
                    orderGross = orderGross
                            .add((op.getGrossPrice() != null ? op.getGrossPrice() : BigDecimal.ZERO).multiply(qty));
                    orderNet = orderNet
                            .add((op.getNetPrice() != null ? op.getNetPrice() : BigDecimal.ZERO).multiply(qty));
                }
                BigDecimal profit = orderNet.subtract(orderGross);
                String duration = calculateDuration(order);
                String customerName = order.getCustomer() != null
                        ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()
                        : (order.getProsapContractNameSurname() != null ? order.getProsapContractNameSurname() : "-");

                String[] row = {
                        truncate(order.getOrderNo(), 18),
                        truncate(customerName, 24),
                        order.getOrderDate().format(TR_DATE),
                        getStatusText(order.getStatus()),
                        productCount + " ürün",
                        formatMoney(orderGross),
                        formatMoney(orderNet),
                        formatMoney(profit),
                        duration
                };
                y = drawTableRow(cs, font, row, colWidths, margin, y, rowColor);
            }
            drawPageNumber(cs, font, page, pageNum);
            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] generateStockSalePdf(List<Sale> sales, Report report, GenerateStockSaleReportRequest request)
            throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDFont font = loadFont(doc);
            float pageWidth = PDRectangle.A4.getHeight();
            float pageHeight = PDRectangle.A4.getWidth();
            float margin = 40;
            float usableWidth = pageWidth - 2 * margin;

            // Stats
            long completed = sales.stream()
                    .filter(s -> s.getStatus() == SaleStatus.TAMAMLANDI || s.getStatus() == SaleStatus.DELIVERED)
                    .count();
            long cancelled = sales.stream().filter(s -> s.getStatus() == SaleStatus.IPTAL_EDILDI).count();
            long inProgress = sales.size() - completed - cancelled;

            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal totalCost = BigDecimal.ZERO;
            for (Sale s : sales) {
                totalRevenue = totalRevenue.add(s.getTotalNet() != null ? s.getTotalNet() : BigDecimal.ZERO);
                for (SaleProduct sp : s.getProducts()) {
                    BigDecimal cost = findStockCostPrice(sp);
                    totalCost = totalCost.add(cost.multiply(BigDecimal.valueOf(sp.getQuantity())));
                }
            }

            // --- TABLE COLUMNS (auto-expand) ---
            String[] headers = { "Satış No", "Müşteri", "Danışman", "Tarih", "Durum", "Satış Fiyatı", "Stok Maliyeti",
                    "Kâr" };
            float[] colWidths = expandColumns(new float[] { 95, 130, 110, 75, 70, 95, 95, 85 }, usableWidth);

            // --- PAGE 1: Header + Table ---
            PDPage page = new PDPage(new PDRectangle(pageWidth, pageHeight));
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = pageHeight - margin;

            y = drawCompactHeader(cs, font, "STOKLU SATIŞ RAPORU", report, y, margin);

            y -= 6;
            cs.setFont(font, 8.5f);
            cs.setNonStrokingColor(new Color(60, 50, 30));
            String stats = "Dönem: " + request.getStartDate().format(TR_DATE) + " - "
                    + request.getEndDate().format(TR_DATE) + "  ·  Toplam: " + sales.size()
                    + "  ·  Tamamlanan: " + completed + "  ·  Devam: " + inProgress + "  ·  İptal: " + cancelled;
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText(stats);
            cs.endText();
            y -= 13;

            String financial = "Satış Geliri: " + formatMoney(totalRevenue) + " TL  ·  Stok Maliyeti: "
                    + formatMoney(totalCost) + " TL  ·  Kâr: "
                    + formatMoney(totalRevenue.subtract(totalCost)) + " TL";
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText(financial);
            cs.endText();
            cs.setNonStrokingColor(Color.BLACK);
            y -= 16;

            y = drawTableHeader(cs, font, headers, colWidths, margin, y);
            int pageNum = 1;

            for (Sale sale : sales) {
                if (y < 50) {
                    drawPageNumber(cs, font, page, pageNum++);
                    cs.close();
                    page = new PDPage(new PDRectangle(pageWidth, pageHeight));
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = pageHeight - margin;
                    y = drawTableHeader(cs, font, headers, colWidths, margin, y);
                }

                Color rowColor = getSaleRowColor(sale);
                BigDecimal saleRevenue = sale.getTotalNet() != null ? sale.getTotalNet() : BigDecimal.ZERO;
                BigDecimal saleCost = BigDecimal.ZERO;
                for (SaleProduct sp : sale.getProducts()) {
                    BigDecimal cost = findStockCostPrice(sp);
                    saleCost = saleCost.add(cost.multiply(BigDecimal.valueOf(sp.getQuantity())));
                }

                String[] row = {
                        truncate(sale.getSaleNo(), 18),
                        truncate(sale.getCustomer().getFirstName() + " " + sale.getCustomer().getLastName(), 24),
                        truncate(sale.getSalesConsultant().getFirstName() + " "
                                + sale.getSalesConsultant().getLastName(), 20),
                        sale.getSaleDate().format(TR_DATE),
                        getSaleStatusText(sale.getStatus()),
                        formatMoney(saleRevenue),
                        formatMoney(saleCost),
                        formatMoney(saleRevenue.subtract(saleCost))
                };
                y = drawTableRow(cs, font, row, colWidths, margin, y, rowColor);
            }
            drawPageNumber(cs, font, page, pageNum);
            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] generateShipmentPdf(List<Shipment> shipments, Report report, GenerateShipmentReportRequest request)
            throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDFont font = loadFont(doc);
            float pageWidth = PDRectangle.A4.getHeight();
            float pageHeight = PDRectangle.A4.getWidth();
            float margin = 40;
            float usableWidth = pageWidth - 2 * margin;

            // Stats
            long finalized = shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.FINALIZED).count();
            long completed = shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count();
            long pending = shipments.stream().filter(
                    s -> s.getStatus() == ShipmentStatus.PENDING || s.getStatus() == ShipmentStatus.APPROVED)
                    .count();
            long planned = shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.PLANNED).count();
            long withSsh = shipments.stream().filter(s -> s.getLinkedSshOrder() != null).count();
            long problemCount = shipments.stream().filter(s -> s.getProblemType() != null).count();

            // --- TABLE COLUMNS (auto-expand) ---
            String[] headers = { "Ref No", "Tür", "Durum", "Oluşturma", "Planlanan", "Teslim", "Onay", "Süre",
                    "Sevk Eden" };
            float[] colWidths = expandColumns(new float[] { 95, 60, 75, 80, 80, 80, 80, 50, 95 }, usableWidth);

            // --- PAGE 1: Header + Table ---
            PDPage page = new PDPage(new PDRectangle(pageWidth, pageHeight));
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = pageHeight - margin;

            y = drawCompactHeader(cs, font, "SEVKİYAT RAPORU", report, y, margin);

            y -= 6;
            cs.setFont(font, 8.5f);
            cs.setNonStrokingColor(new Color(60, 50, 30));
            String stats = "Dönem: " + request.getStartDate().format(TR_DATE) + " - "
                    + request.getEndDate().format(TR_DATE) + "  ·  Toplam: " + shipments.size()
                    + "  ·  Teslim: " + finalized + "  ·  Onay Bekliyor: " + completed
                    + "  ·  Planlanan: " + planned + "  ·  Beklemede: " + pending;
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText(stats);
            cs.endText();
            y -= 13;

            String extraInfo = "SSH Oluşan: " + withSsh + "  ·  Problemli: " + problemCount;
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText(extraInfo);
            cs.endText();
            cs.setNonStrokingColor(Color.BLACK);
            y -= 16;

            y = drawTableHeader(cs, font, headers, colWidths, margin, y);
            int pageNum = 1;

            for (Shipment shipment : shipments) {
                if (y < 50) {
                    drawPageNumber(cs, font, page, pageNum++);
                    cs.close();
                    page = new PDPage(new PDRectangle(pageWidth, pageHeight));
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = pageHeight - margin;
                    y = drawTableHeader(cs, font, headers, colWidths, margin, y);
                }

                Color rowColor = getShipmentRowColor(shipment);
                String refNo = shipment.getOrder() != null
                        ? shipment.getOrder().getOrderNo()
                        : (shipment.getSale() != null ? shipment.getSale().getSaleNo() : "-");
                String type = shipment.getOrder() != null ? "Sipariş" : "Satış";
                String createdDate = shipment.getCreatedAt() != null
                        ? java.time.LocalDateTime.ofInstant(shipment.getCreatedAt(), java.time.ZoneId.systemDefault())
                                .format(TR_DATE)
                        : "-";
                String plannedDate = shipment.getPlannedShipmentDate() != null
                        ? shipment.getPlannedShipmentDate().format(TR_DATE)
                        : "-";
                String deliveryDate = shipment.getActualShipmentDate() != null
                        ? shipment.getActualShipmentDate().format(TR_DATE)
                        : "-";
                String approvalDate = shipment.getApprovalDate() != null ? shipment.getApprovalDate().format(TR_DATE)
                        : "-";
                String duration = calculateShipmentDuration(shipment);
                String shippedBy = shipment.getShippedBy() != null
                        ? truncate(shipment.getShippedBy().getFirstName() + " " + shipment.getShippedBy().getLastName(),
                                20)
                        : "-";

                String[] row = {
                        truncate(refNo, 18),
                        type,
                        getShipmentStatusText(shipment.getStatus()),
                        createdDate,
                        plannedDate,
                        deliveryDate,
                        approvalDate,
                        duration,
                        shippedBy
                };
                y = drawTableRow(cs, font, row, colWidths, margin, y, rowColor);

                // SSH detail row
                if (shipment.getLinkedSshOrder() != null || shipment.getProblemType() != null) {
                    if (y < 50) {
                        drawPageNumber(cs, font, page, pageNum++);
                        cs.close();
                        page = new PDPage(new PDRectangle(pageWidth, pageHeight));
                        doc.addPage(page);
                        cs = new PDPageContentStream(doc, page);
                        y = pageHeight - margin;
                    }
                    String sshInfo = "  → SSH: " +
                            (shipment.getProblemType() != null ? shipment.getProblemType().name() : "") +
                            (shipment.getLinkedSshOrder() != null
                                    ? " | SSH Sipariş: " + shipment.getLinkedSshOrder().getOrderNo()
                                    : "");
                    y = drawText(cs, font, 7.5f, sshInfo, margin + 5, y);
                }
            }
            drawPageNumber(cs, font, page, pageNum);
            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    // =================== PDF HELPERS ===================

    private PDFont loadFont(PDDocument doc) throws Exception {
        // Try to load a Turkish-compatible font from classpath, fallback to Helvetica
        try {
            InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf");
            if (fontStream != null) {
                return PDType0Font.load(doc, fontStream);
            }
        } catch (Exception e) {
            log.warn("Could not load DejaVuSans font, trying system font");
        }
        // Fallback: try system font
        try {
            java.io.File systemFont = new java.io.File("C:/Windows/Fonts/arial.ttf");
            if (systemFont.exists()) {
                return PDType0Font.load(doc, systemFont);
            }
        } catch (Exception e) {
            log.warn("Could not load system Arial font");
        }
        // Last fallback - use system default
        try {
            java.io.File calibri = new java.io.File("C:/Windows/Fonts/calibri.ttf");
            if (calibri.exists()) {
                return PDType0Font.load(doc, calibri);
            }
        } catch (Exception e) {
            log.warn("Could not load Calibri font");
        }
        // If nothing works, use standard font (limited Turkish support)
        return org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA;
    }

    private float drawCompactHeader(PDPageContentStream cs, PDFont font, String title, Report report, float y,
            float margin) throws Exception {
        // Brand + Title on same conceptual area
        cs.setNonStrokingColor(new Color(120, 80, 20));
        cs.setFont(font, 9);
        cs.beginText();
        cs.newLineAtOffset(margin, y);
        cs.showText("StokMate");
        cs.endText();
        y -= 20;

        cs.setNonStrokingColor(new Color(40, 30, 10));
        cs.setFont(font, 16);
        cs.beginText();
        cs.newLineAtOffset(margin, y);
        cs.showText(title);
        cs.endText();

        // Report info (right-aligned on same line)
        String reportInfo = "Rapor: " + report.getReportNo() + "  ·  "
                + report.getCreatedAt().format(TR_DATETIME) + "  ·  "
                + (report.getCreatedBy().getFirstName() != null
                        ? report.getCreatedBy().getFirstName() + " " + report.getCreatedBy().getLastName()
                        : report.getCreatedBy().getEmail());
        cs.setFont(font, 7.5f);
        cs.setNonStrokingColor(new Color(120, 110, 90));
        float infoWidth = font.getStringWidth(reportInfo) / 1000 * 7.5f;
        float pageWidth = 842; // Landscape A4
        cs.beginText();
        cs.newLineAtOffset(pageWidth - margin - infoWidth, y + 2);
        cs.showText(reportInfo);
        cs.endText();
        y -= 18;

        // Decorative line
        cs.setStrokingColor(new Color(180, 120, 30));
        cs.setLineWidth(2f);
        cs.moveTo(margin, y);
        cs.lineTo(margin + 160, y);
        cs.stroke();
        cs.setStrokingColor(new Color(220, 190, 130));
        cs.setLineWidth(0.8f);
        cs.moveTo(margin + 160, y);
        cs.lineTo(pageWidth - margin, y);
        cs.stroke();
        y -= 10;

        cs.setNonStrokingColor(Color.BLACK);
        return y;
    }

    private float[] expandColumns(float[] baseWidths, float targetWidth) {
        float total = 0;
        for (float w : baseWidths)
            total += w;
        float scale = targetWidth / total;
        float[] result = new float[baseWidths.length];
        for (int i = 0; i < baseWidths.length; i++) {
            result[i] = baseWidths[i] * scale;
        }
        return result;
    }

    private float drawText(PDPageContentStream cs, PDFont font, float fontSize, String text, float x, float y)
            throws Exception {
        cs.setFont(font, fontSize);
        cs.beginText();
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - (fontSize + 4);
    }

    private float drawTableHeader(PDPageContentStream cs, PDFont font, String[] headers, float[] colWidths,
            float startX, float y) throws Exception {
        // Background - dark amber/brown
        float totalWidth = 0;
        for (float w : colWidths)
            totalWidth += w;
        cs.setNonStrokingColor(new Color(90, 60, 20));
        cs.addRect(startX, y - 18, totalWidth, 22);
        cs.fill();

        // Bottom accent line
        cs.setStrokingColor(new Color(180, 130, 40));
        cs.setLineWidth(1.5f);
        cs.moveTo(startX, y - 18);
        cs.lineTo(startX + totalWidth, y - 18);
        cs.stroke();

        // Header text
        cs.setNonStrokingColor(new Color(255, 248, 230));
        cs.setFont(font, 8.5f);
        float x = startX + 5;
        for (int i = 0; i < headers.length; i++) {
            cs.beginText();
            cs.newLineAtOffset(x, y - 13);
            cs.showText(headers[i]);
            cs.endText();
            x += colWidths[i];
        }
        cs.setNonStrokingColor(Color.BLACK);
        return y - 22;
    }

    private float drawTableRow(PDPageContentStream cs, PDFont font, String[] values, float[] colWidths, float startX,
            float y, Color bgColor) throws Exception {
        float totalWidth = 0;
        for (float w : colWidths)
            totalWidth += w;

        if (bgColor != null) {
            cs.setNonStrokingColor(bgColor);
            cs.addRect(startX, y - 15, totalWidth, 19);
            cs.fill();
        }

        // Row border - subtle
        cs.setStrokingColor(new Color(210, 200, 180));
        cs.setLineWidth(0.4f);
        cs.moveTo(startX, y - 15);
        cs.lineTo(startX + totalWidth, y - 15);
        cs.stroke();

        cs.setNonStrokingColor(new Color(30, 25, 15));
        cs.setFont(font, 8);
        float x = startX + 5;
        for (int i = 0; i < values.length; i++) {
            cs.beginText();
            cs.newLineAtOffset(x, y - 11);
            cs.showText(values[i] != null ? values[i] : "-");
            cs.endText();
            x += colWidths[i];
        }
        return y - 19;
    }

    private void drawPageNumber(PDPageContentStream cs, PDFont font, PDPage page, int pageNum) throws Exception {
        float pageWidth = page.getMediaBox().getWidth();
        // Footer line
        cs.setStrokingColor(new Color(210, 200, 180));
        cs.setLineWidth(0.5f);
        cs.moveTo(40, 32);
        cs.lineTo(pageWidth - 40, 32);
        cs.stroke();

        // Left: brand
        cs.setFont(font, 7);
        cs.setNonStrokingColor(new Color(150, 130, 100));
        cs.beginText();
        cs.newLineAtOffset(40, 20);
        cs.showText("StokMate Raporlama");
        cs.endText();

        // Center: page number
        String pageText = "Sayfa " + pageNum;
        float textWidth = font.getStringWidth(pageText) / 1000 * 7;
        cs.beginText();
        cs.newLineAtOffset((pageWidth - textWidth) / 2, 20);
        cs.showText(pageText);
        cs.endText();

        // Right: confidential
        String confText = "Gizli / Dahili Kullanim";
        float confWidth = font.getStringWidth(confText) / 1000 * 7;
        cs.beginText();
        cs.newLineAtOffset(pageWidth - 40 - confWidth, 20);
        cs.showText(confText);
        cs.endText();
        cs.setNonStrokingColor(Color.BLACK);
    }

    // =================== COLOR LOGIC ===================

    private Color getOrderRowColor(Order order) {
        OrderStatus status = order.getStatus();
        boolean isCompleted = isCompleted(status);
        boolean isCancelled = isCancelled(status);
        boolean hasSsh = order.getOrderType() == OrderType.AFTER_SALES_SERVICE || hasSshChildren(order);

        if (isCancelled) {
            if (order.isConvertedFromCustomer() && isCancelled) {
                return new Color(200, 130, 130); // Koyu pembe - tamamen kapanmış
            }
            return new Color(250, 210, 210); // Açık pembe - iptal
        }

        if (isCompleted) {
            if (hasSsh) {
                return new Color(210, 245, 210); // Açık yeşil - SSH tamamlanmış
            }
            return new Color(220, 250, 220); // Pastel yeşil - sorunsuz tamamlanmış
        }

        // In progress with SSH
        if (hasSsh) {
            return new Color(255, 225, 170); // Açık turuncu - SSH devam ediyor
        }

        // Check partial shipment
        boolean hasShipment = order.getProducts().stream()
                .anyMatch(p -> p.getShippedQuantity() != null && p.getShippedQuantity().compareTo(BigDecimal.ZERO) > 0);
        if (hasShipment) {
            return new Color(255, 250, 210); // Açık sarı - kısmi sevkiyat
        }

        return new Color(255, 253, 235); // Çok açık sarı - henüz sevkiyat yok
    }

    private Color getSaleRowColor(Sale sale) {
        SaleStatus status = sale.getStatus();
        if (status == SaleStatus.TAMAMLANDI || status == SaleStatus.DELIVERED) {
            return new Color(220, 250, 220); // Pastel yeşil
        }
        if (status == SaleStatus.IPTAL_EDILDI) {
            return new Color(250, 215, 215); // Pastel pembe
        }
        boolean hasShipment = sale.getProducts().stream()
                .anyMatch(p -> p.getShippedQuantity() != null && p.getShippedQuantity().compareTo(BigDecimal.ZERO) > 0);
        if (hasShipment) {
            return new Color(255, 250, 210); // Açık sarı
        }
        return new Color(255, 253, 235); // Çok açık sarı
    }

    private Color getShipmentRowColor(Shipment shipment) {
        if (shipment.getStatus() == ShipmentStatus.FINALIZED) {
            return new Color(220, 250, 220); // Pastel yeşil
        }
        if (shipment.getStatus() == ShipmentStatus.COMPLETED) {
            return new Color(235, 255, 235); // Açık yeşil
        }
        if (shipment.getProblemType() != null) {
            return new Color(255, 225, 190); // Açık turuncu
        }
        if (shipment.getStatus() == ShipmentStatus.PLANNED) {
            return new Color(230, 240, 255); // Açık mavi
        }
        return new Color(255, 253, 240);
    }

    // =================== UTILITY ===================

    private Report createReportRecord(ReportType type, LocalDate start, LocalDate end, String filters, User user,
            String customTitle) {
        String reportNo = "RPT-" + type.name().charAt(0) + "-" + System.currentTimeMillis();
        String title;
        if (customTitle != null && !customTitle.isBlank()) {
            title = customTitle;
        } else {
            switch (type) {
                case ORDER:
                    title = "Sipariş Raporu";
                    break;
                case STOCK_SALE:
                    title = "Stoklu Satış Raporu";
                    break;
                case SHIPMENT:
                    title = "Sevkiyat Raporu";
                    break;
                default:
                    title = "Rapor";
            }
            title += " (" + start.format(TR_DATE) + " - " + end.format(TR_DATE) + ")";
        }

        Report report = Report.builder()
                .reportNo(reportNo)
                .reportType(type)
                .status(ReportStatus.GENERATING)
                .title(title)
                .startDate(start)
                .endDate(end)
                .filters(filters)
                .createdBy(user)
                .createdAt(LocalDateTime.now())
                .build();
        return reportRepository.save(report);
    }

    private String buildFilterDescription(List<UUID> consultantIds, List<String> brands) {
        StringBuilder sb = new StringBuilder();
        if (consultantIds != null && !consultantIds.isEmpty()) {
            sb.append("Danışman: ").append(consultantIds.size()).append(" seçili");
        }
        if (brands != null && !brands.isEmpty()) {
            if (sb.length() > 0)
                sb.append(" | ");
            sb.append("Marka: ").append(String.join(", ", brands));
        }
        return sb.length() > 0 ? sb.toString() : "Tüm kayıtlar";
    }

    private BigDecimal findStockCostPrice(SaleProduct sp) {
        if (sp.getProduct() == null)
            return BigDecimal.ZERO;
        List<ProductPriceHistory> histories = priceHistoryRepository
                .findByProductIdOrderByCreatedAtDesc(sp.getProduct().getId());
        if (!histories.isEmpty()) {
            // Latest price history entry represents the cost/arrival price
            ProductPriceHistory latest = histories.get(0);
            return latest.getNetPrice() != null ? latest.getNetPrice()
                    : (latest.getGrossPrice() != null ? latest.getGrossPrice() : BigDecimal.ZERO);
        }
        return BigDecimal.ZERO;
    }

    private boolean isCompleted(OrderStatus status) {
        return status == OrderStatus.COMPLETED || status == OrderStatus.DELIVERED || status == OrderStatus.TAMAMLANDI;
    }

    private boolean isCancelled(OrderStatus status) {
        return status == OrderStatus.CANCELLED || status == OrderStatus.IPTAL_EDILDI;
    }

    private boolean hasSshChildren(Order order) {
        // Check if there are SSH child orders
        try {
            List<Order> children = orderRepository.findByParentOrderId(order.getId());
            return children != null && !children.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private String calculateDuration(Order order) {
        if (order.getOrderDate() == null)
            return "-";
        LocalDate end;
        if (isCompleted(order.getStatus())) {
            // Use updatedAt from audit
            end = order.getUpdatedAt() != null
                    ? java.time.LocalDate.ofInstant(order.getUpdatedAt(), java.time.ZoneId.systemDefault())
                    : LocalDate.now();
        } else {
            end = LocalDate.now();
        }
        long days = ChronoUnit.DAYS.between(order.getOrderDate(), end);
        return days + "g";
    }

    private String calculateShipmentDuration(Shipment shipment) {
        if (shipment.getCreatedAt() == null)
            return "-";
        java.time.Instant endTime = shipment.getApprovalDate() != null
                ? shipment.getApprovalDate().atZone(java.time.ZoneId.systemDefault()).toInstant()
                : (shipment.getActualShipmentDate() != null
                        ? shipment.getActualShipmentDate().atZone(java.time.ZoneId.systemDefault()).toInstant()
                        : java.time.Instant.now());
        long hours = ChronoUnit.HOURS.between(shipment.getCreatedAt(), endTime);
        if (hours < 24)
            return hours + "s";
        return (hours / 24) + "g";
    }

    private String getStatusText(OrderStatus status) {
        if (isCompleted(status))
            return "Tamamlandi";
        if (isCancelled(status))
            return "Iptal";
        return "Devam";
    }

    private String getSaleStatusText(SaleStatus status) {
        if (status == SaleStatus.TAMAMLANDI || status == SaleStatus.DELIVERED)
            return "Tamamlandi";
        if (status == SaleStatus.IPTAL_EDILDI)
            return "Iptal";
        return "Devam";
    }

    private String getShipmentStatusText(ShipmentStatus status) {
        switch (status) {
            case FINALIZED:
                return "Tamamlandi";
            case COMPLETED:
                return "Onay Bekl.";
            case PLANNED:
                return "Planlandi";
            case APPROVED:
                return "Onayli";
            default:
                return "Beklemede";
        }
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null)
            return "0,00";
        return amount.setScale(2, RoundingMode.HALF_UP).toString().replace('.', ',');
    }

    private String truncate(String text, int max) {
        if (text == null)
            return "-";
        return text.length() > max ? text.substring(0, max - 1) + "." : text;
    }

    private ReportResponse toResponse(Report report) {
        String createdByName = report.getCreatedBy() != null
                ? (report.getCreatedBy().getFirstName() != null
                        ? report.getCreatedBy().getFirstName() + " " + report.getCreatedBy().getLastName()
                        : report.getCreatedBy().getEmail())
                : "-";
        String createdByEmail = report.getCreatedBy() != null ? report.getCreatedBy().getEmail() : "-";

        return ReportResponse.builder()
                .id(report.getId())
                .reportNo(report.getReportNo())
                .reportType(report.getReportType().name())
                .status(report.getStatus().name())
                .title(report.getTitle())
                .description(report.getDescription())
                .startDate(report.getStartDate())
                .endDate(report.getEndDate())
                .filters(report.getFilters())
                .totalRecords(report.getTotalRecords())
                .totalRevenue(report.getTotalRevenue())
                .totalCost(report.getTotalCost())
                .totalProfit(report.getTotalProfit())
                .createdByName(createdByName)
                .createdByEmail(createdByEmail)
                .createdAt(report.getCreatedAt())
                .completedAt(report.getCompletedAt())
                .pdfFileKey(report.getPdfFileKey())
                .build();
    }
}
