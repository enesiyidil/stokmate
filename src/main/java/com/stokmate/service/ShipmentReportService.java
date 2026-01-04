package com.stokmate.service;

import com.stokmate.dto.shipment.ShipmentDetailsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShipmentReportService {

        private final ShipmentService shipmentService;

        private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");

        // Navy header: #1F3864
        private static final float NAVY_R = 31f / 255f;
        private static final float NAVY_G = 56f / 255f;
        private static final float NAVY_B = 100f / 255f;

        // Light blue ~ #D9E1F2
        private static final float LBLUE_R = 217f / 255f;
        private static final float LBLUE_G = 225f / 255f;
        private static final float LBLUE_B = 242f / 255f;

        // Light gray ~ #E7E6E6
        private static final float LGRAY_R = 231f / 255f;
        private static final float LGRAY_G = 230f / 255f;
        private static final float LGRAY_B = 230f / 255f;

        // Orange footer: #ED7D31
        private static final float ORANGE_R = 237f / 255f;
        private static final float ORANGE_G = 125f / 255f;
        private static final float ORANGE_B = 49f / 255f;

        private String normalizeText(String text) {
                if (text == null)
                        return "";
                return text
                                .replace("Ş", "S").replace("ş", "s")
                                .replace("İ", "I").replace("ı", "i")
                                .replace("Ğ", "G").replace("ğ", "g")
                                .replace("Ü", "U").replace("ü", "u")
                                .replace("Ö", "O").replace("ö", "o")
                                .replace("Ç", "C").replace("ç", "c");
        }

        public byte[] generateShipmentReport(UUID orderId) throws IOException {
                ShipmentDetailsResponse details = shipmentService.getShipmentDetails(orderId);

                try (PDDocument document = new PDDocument()) {
                        PDPage page = new PDPage(PDRectangle.A4);
                        document.addPage(page);

                        try (PDPageContentStream cs = new PDPageContentStream(document, page)) {

                                float pageW = page.getMediaBox().getWidth();
                                float pageH = page.getMediaBox().getHeight();

                                float margin = 24f;
                                float x = margin;
                                float yTop = pageH - margin;

                                float contentW = pageW - 2 * margin;
                                float contentH = pageH - 2 * margin;

                                // Outer border
                                drawRect(cs, x, yTop - contentH, contentW, contentH, 1.8f);

                                float currentY = yTop;

                                currentY = drawHeader(cs, x, currentY, contentW, details);
                                currentY -= 10;

                                currentY = drawDescription(cs, x, currentY, contentW, details);
                                currentY -= 10;

                                currentY = drawEquipmentTable(cs, x, currentY, contentW, details);
                                currentY -= 12;

                                currentY = drawSignature(cs, x, currentY, contentW, details);
                                currentY -= 10;

                                drawFooter(cs, x, currentY, contentW, details);
                        }

                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        document.save(baos);
                        return baos.toByteArray();
                }
        }

        // =========================
        // 1) HEADER
        // =========================
        private float drawHeader(PDPageContentStream cs, float x, float yTop, float width,
                        ShipmentDetailsResponse details) throws IOException {

                float h = 56f;

                float logoW = width * 0.12f;
                float titleW = width * 0.52f;
                float infoW = width - logoW - titleW;

                float y = yTop;

                // Logo box
                drawRect(cs, x, y - h, logoW, h, 1.0f);
                drawCenteredText(cs, normalizeText("CRAFT LOGO"), x, y - 20, logoW, PDType1Font.HELVETICA, 8);
                drawCenteredText(cs, normalizeText("GELECEK"), x, y - 32, logoW, PDType1Font.HELVETICA, 8);

                // Title box
                float titleX = x + logoW;
                fillRect(cs, titleX, y - h, titleW, h, LBLUE_R, LBLUE_G, LBLUE_B);
                drawRect(cs, titleX, y - h, titleW, h, 1.0f);

                drawCenteredText(cs, normalizeText("CRAFT MOBILYA MONTAJ VE"), titleX, y - 24, titleW,
                                PDType1Font.HELVETICA_BOLD, 12);
                drawCenteredText(cs, normalizeText("TESLIM TUTANAGI"), titleX, y - 40, titleW,
                                PDType1Font.HELVETICA_BOLD, 12);

                // Info grid
                float infoX = titleX + titleW;
                float rows = 5f;
                float rowH = h / rows;
                float labelW = infoW * 0.55f;
                float valueW = infoW - labelW;

                drawRect(cs, infoX, y - h, infoW, h, 1.0f);

                String[] labels = {
                                "SOZLESME NO",
                                "SIPARIS NO",
                                "SIPARIS TARIHI",
                                "TESLIM TARIHI",
                                ""
                };

                String[] values = {
                                normalizeText(nvl(details.getContractNo())),
                                normalizeText(nvl(details.getOrderNo())),
                                details.getOrderDate() != null ? details.getOrderDate().format(DATE_FORMATTER) : "",
                                details.getPlannedShipmentDate() != null
                                                ? details.getPlannedShipmentDate().format(DATE_FORMATTER)
                                                : "",
                                ""
                };

                for (int i = 0; i < (int) rows; i++) {
                        float rowTop = y - (i * rowH);

                        drawRect(cs, infoX, rowTop - rowH, labelW, rowH, 0.8f);
                        drawRect(cs, infoX + labelW, rowTop - rowH, valueW, rowH, 0.8f);

                        if (!labels[i].isBlank()) {
                                drawCenteredText(cs, normalizeText(labels[i]),
                                                infoX, rowTop - (rowH / 2) - 3, labelW, PDType1Font.HELVETICA_BOLD, 8);
                        }
                        if (!values[i].isBlank()) {
                                String v = fitTextToWidth(normalizeText(values[i]), PDType1Font.HELVETICA_BOLD, 8,
                                                valueW - 6);
                                drawCenteredText(cs, v,
                                                infoX + labelW, rowTop - (rowH / 2) - 3, valueW,
                                                PDType1Font.HELVETICA_BOLD, 8);
                        }
                }

                return yTop - h;
        }

        // =========================
        // 2) DESCRIPTION
        // =========================
        private float drawDescription(PDPageContentStream cs, float x, float yTop, float width,
                        ShipmentDetailsResponse details) throws IOException {

                float headerH = 18f;
                float bodyH = 120f;

                // Header
                fillRect(cs, x, yTop - headerH, width, headerH, LBLUE_R, LBLUE_G, LBLUE_B);
                drawRect(cs, x, yTop - headerH, width, headerH, 1.0f);
                drawCenteredText(cs, normalizeText("ACIKLAMA"), x, yTop - 13, width, PDType1Font.HELVETICA_BOLD, 11);

                // Body
                float bodyY = yTop - headerH - bodyH;
                drawRect(cs, x, bodyY, width, bodyH, 1.0f);

                float inset = 10f;
                drawRect(cs, x + inset, bodyY + inset, width - 2 * inset, bodyH - 2 * inset, 0.7f);

                // “MUSTERI: ...” (sığdır)
                if (details.getCustomer() != null && details.getCustomer().getName() != null) {
                        String line1 = "MUSTERI: " + normalizeText(details.getCustomer().getName());
                        String fitted = fitTextToWidth(line1, PDType1Font.HELVETICA_BOLD, 8, (width - 2 * inset) - 12);
                        drawText(cs, fitted, x + inset + 6, bodyY + bodyH - inset - 16, PDType1Font.HELVETICA_BOLD, 8);
                }

                // TESLIM TARIHI label + small box
                float gapBelow = 10f;
                float labelY = bodyY - gapBelow - 10f;

                float boxW = 120f;
                float boxH = 14f;
                float boxX = x + width - boxW - 10f;

                drawRightText(cs, normalizeText("TESLIM TARIHI"), boxX - 6, labelY + 3, PDType1Font.HELVETICA_BOLD, 8);
                drawRect(cs, boxX, labelY - (boxH - 3), boxW, boxH, 0.8f);

                return labelY - (boxH + 4);
        }

        // =========================
        // 3) TABLE
        // =========================
        private float drawEquipmentTable(PDPageContentStream cs, float x, float yTop, float width,
                        ShipmentDetailsResponse details) throws IOException {

                float titleH = 16f;
                float headerH = 18f;
                float rowH = 18f;
                int maxRows = 15;

                // Title bar
                fillRect(cs, x, yTop - titleH, width, titleH, NAVY_R, NAVY_G, NAVY_B);
                drawRect(cs, x, yTop - titleH, width, titleH, 1.0f);
                drawCenteredTextColored(cs, normalizeText("TESLIM EDILEN EKIPMANLAR"),
                                x, yTop - 12, width, PDType1Font.HELVETICA_BOLD, 10, 1f, 1f, 1f);

                float y = yTop - titleH;

                // Column widths (görsele daha yakın)
                float colSira = width * 0.06f;
                float colUrun = width * 0.69f;
                float colKod = width * 0.13f;
                float colMik = width - colSira - colUrun - colKod;

                // Header row
                fillRect(cs, x, y - headerH, width, headerH, LBLUE_R, LBLUE_G, LBLUE_B);
                drawRect(cs, x, y - headerH, width, headerH, 0.9f);
                drawLine(cs, x + colSira, y, x + colSira, y - headerH, 0.7f);
                drawLine(cs, x + colSira + colUrun, y, x + colSira + colUrun, y - headerH, 0.7f);
                drawLine(cs, x + colSira + colUrun + colKod, y, x + colSira + colUrun + colKod, y - headerH, 0.7f);

                drawCenteredText(cs, normalizeText("SIRA"), x, y - 13, colSira, PDType1Font.HELVETICA_BOLD, 9);
                drawCenteredText(cs, normalizeText("URUN ADI"), x + colSira, y - 13, colUrun,
                                PDType1Font.HELVETICA_BOLD, 9);
                drawCenteredText(cs, normalizeText("URUN KODU"), x + colSira + colUrun, y - 13, colKod,
                                PDType1Font.HELVETICA_BOLD, 9);
                drawCenteredText(cs, normalizeText("MIKTARI"), x + colSira + colUrun + colKod, y - 13, colMik,
                                PDType1Font.HELVETICA_BOLD, 9);

                y -= headerH;

                List<ShipmentDetailsResponse.ProductShipmentDetail> products = details.getProducts() != null
                                ? details.getProducts()
                                : List.of();

                for (int i = 0; i < maxRows; i++) {

                        // SIRA column fill
                        fillRect(cs, x, y - rowH, colSira, rowH, LBLUE_R, LBLUE_G, LBLUE_B);

                        // Row borders
                        drawRect(cs, x, y - rowH, width, rowH, 0.7f);
                        drawLine(cs, x + colSira, y, x + colSira, y - rowH, 0.6f);
                        drawLine(cs, x + colSira + colUrun, y, x + colSira + colUrun, y - rowH, 0.6f);
                        drawLine(cs, x + colSira + colUrun + colKod, y, x + colSira + colUrun + colKod, y - rowH, 0.6f);

                        // Row number
                        drawCenteredText(cs, String.valueOf(i + 1), x, y - 13, colSira, PDType1Font.HELVETICA_BOLD, 8);

                        if (i < products.size() && products.get(i) != null
                                        && products.get(i).getPendingQuantity() > 0) {
                                ShipmentDetailsResponse.ProductShipmentDetail p = products.get(i);

                                // URUN ADI (left) -> FIT (taşmayı bitirir)
                                String name = normalizeText(nvl(p.getProductName()));
                                String nameFit = fitTextToWidth(name, PDType1Font.HELVETICA_BOLD, 8, colUrun - 8);
                                drawText(cs, nameFit, x + colSira + 4, y - 13, PDType1Font.HELVETICA_BOLD, 8);

                                // URUN KODU (center) -> FIT
                                String code = normalizeText(nvl(p.getProductCode()));
                                String codeFit = fitTextToWidth(code, PDType1Font.HELVETICA_BOLD, 8, colKod - 6);
                                drawCenteredText(cs, codeFit, x + colSira + colUrun, y - 13, colKod,
                                                PDType1Font.HELVETICA_BOLD, 8);

                                // MIKTARI
                                drawCenteredText(cs, String.valueOf(p.getPendingQuantity()),
                                                x + colSira + colUrun + colKod, y - 13, colMik,
                                                PDType1Font.HELVETICA_BOLD, 8);
                        }

                        y -= rowH;
                }

                return y;
        }

        // =========================
        // 4) SIGNATURE
        // =========================
        private float drawSignature(PDPageContentStream cs, float x, float yTop, float width,
                        ShipmentDetailsResponse details) throws IOException {

                float sectionH = 95f;
                float labelH = 16f;

                // Eskiden: gap=60f -> sağ kutu taşıyordu, küçültüyoruz
                float gap = 32f;

                // Kutuların toplam genişliği: 2*boxW + gap = usableW
                // Dış kenarlardan küçük bir iç padding bırakalım (görsele de yakın)
                float innerPad = 18f;
                float usableW = width - 2 * innerPad;

                float boxW = (usableW - gap) / 2f;

                // Kutuları form içinde ortalayalım
                float leftX = x + innerPad;
                float rightX = leftX + boxW + gap;

                // LEFT: TESLIM EDEN
                fillRect(cs, leftX, yTop - labelH, boxW, labelH, LBLUE_R, LBLUE_G, LBLUE_B);
                drawRect(cs, leftX, yTop - labelH, boxW, labelH, 0.9f);
                drawCenteredText(cs, normalizeText("TESLIM EDEN"), leftX, yTop - 12, boxW, PDType1Font.HELVETICA_BOLD,
                                9);

                float bodyH = sectionH - labelH;
                drawRect(cs, leftX, yTop - sectionH, boxW, bodyH, 0.9f);

                if (details.getDriver() != null && details.getDriver().getName() != null) {
                        String dn = normalizeText(details.getDriver().getName());
                        String dnFit = fitTextToWidth(dn, PDType1Font.HELVETICA_BOLD, 9, boxW - 10);
                        drawCenteredText(cs, dnFit, leftX, yTop - labelH - (bodyH / 2) - 4, boxW,
                                        PDType1Font.HELVETICA_BOLD, 9);
                }

                // RIGHT: TESLIM ALAN (SOLA YAKLAŞTI + TAŞMA YOK)
                fillRect(cs, rightX, yTop - labelH, boxW, labelH, LBLUE_R, LBLUE_G, LBLUE_B);
                drawRect(cs, rightX, yTop - labelH, boxW, labelH, 0.9f);
                drawCenteredText(cs, normalizeText("TESLIM ALAN"), rightX, yTop - 12, boxW, PDType1Font.HELVETICA_BOLD,
                                9);

                drawRect(cs, rightX, yTop - sectionH, boxW, bodyH, 0.9f);

                if (details.getCustomer() != null && details.getCustomer().getName() != null) {
                        String cn = normalizeText(details.getCustomer().getName());
                        String cnFit = fitTextToWidth(cn, PDType1Font.HELVETICA_BOLD, 9, boxW - 10);
                        drawCenteredText(cs, cnFit, rightX, yTop - labelH - (bodyH / 2) - 4, boxW,
                                        PDType1Font.HELVETICA_BOLD, 9);
                }

                return yTop - sectionH;
        }

        // =========================
        // 5) FOOTER
        // =========================
        private void drawFooter(PDPageContentStream cs, float x, float yTop, float width,
                        ShipmentDetailsResponse details) throws IOException {

                float h = 52f;

                float leftW = width * 0.62f;
                float qrW = width * 0.12f;
                float rightW = width - leftW - qrW;

                float y = yTop;

                // LEFT split
                float navyLabelW = leftW * 0.30f;
                float grayW = leftW - navyLabelW;

                fillRect(cs, x, y - h, navyLabelW, h, NAVY_R, NAVY_G, NAVY_B);
                drawRect(cs, x, y - h, navyLabelW, h, 0.9f);
                drawCenteredTextColored(cs, normalizeText("ILETISIM BILGILERI"),
                                x, y - (h / 2) + 3, navyLabelW, PDType1Font.HELVETICA_BOLD, 8, 1f, 1f, 1f);

                fillRect(cs, x + navyLabelW, y - h, grayW, h, LGRAY_R, LGRAY_G, LGRAY_B);
                drawRect(cs, x + navyLabelW, y - h, grayW, h, 0.9f);

                if (details.getCustomer() != null && details.getCustomer().getPhone() != null
                                && !details.getCustomer().getPhone().isBlank()) {
                        String phone = normalizeText(details.getCustomer().getPhone());
                        String phoneFit = fitTextToWidth(phone, PDType1Font.HELVETICA_BOLD, 8, grayW - 16);
                        drawText(cs, phoneFit, x + navyLabelW + 10, y - 18, PDType1Font.HELVETICA_BOLD, 8);
                }

                // QR
                float qrX = x + leftW;
                fillRect(cs, qrX, y - h, qrW, h, 1f, 1f, 1f);
                drawRect(cs, qrX, y - h, qrW, h, 0.9f);
                drawCenteredText(cs, normalizeText("KARE KOD"),
                                qrX, y - (h / 2) + 3, qrW, PDType1Font.HELVETICA_BOLD, 7);

                // RIGHT approval
                float rx = qrX + qrW;

                float orangeHeaderH = 18f;
                fillRect(cs, rx, y - orangeHeaderH, rightW, orangeHeaderH, ORANGE_R, ORANGE_G, ORANGE_B);
                drawRect(cs, rx, y - orangeHeaderH, rightW, orangeHeaderH, 0.9f);
                drawCenteredTextColored(cs, normalizeText("BIRIM YETKILISI ONAYI"),
                                rx, y - 13, rightW, PDType1Font.HELVETICA_BOLD, 8, 1f, 1f, 1f);

                float bodyH = h - orangeHeaderH;
                fillRect(cs, rx, y - h, rightW, bodyH, 1f, 1f, 1f);
                drawRect(cs, rx, y - h, rightW, bodyH, 0.9f);

                float innerBoxW = rightW * 0.70f;
                float innerBoxH = 16f;
                float innerBoxX = rx + (rightW - innerBoxW) / 2f;
                float innerBoxY = (y - h) + 6f;
                drawRect(cs, innerBoxX, innerBoxY, innerBoxW, innerBoxH, 0.8f);

                String approver = (details.getDriver() != null && details.getDriver().getName() != null)
                                ? normalizeText(details.getDriver().getName())
                                : "";

                if (!approver.isBlank()) {
                        String apprFit = fitTextToWidth(approver, PDType1Font.HELVETICA_BOLD, 7, innerBoxW - 10);
                        drawCenteredText(cs, apprFit, innerBoxX, innerBoxY + 5, innerBoxW, PDType1Font.HELVETICA_BOLD,
                                        7);
                }

                // NOTE: "CRAFT YONGEM" yazisi KALDIRILDI (istenen)
        }

        // =========================
        // TEXT FIT (taşmayı çözer)
        // =========================
        private String fitTextToWidth(String text, PDType1Font font, int size, float maxWidth) throws IOException {
                if (text == null)
                        return "";
                String t = text.trim();
                if (t.isEmpty())
                        return "";

                float w = font.getStringWidth(t) / 1000f * size;
                if (w <= maxWidth)
                        return t;

                String ell = "...";
                float ellW = font.getStringWidth(ell) / 1000f * size;

                // maxWidth çok küçükse boş dön
                if (ellW >= maxWidth)
                        return "";

                int lo = 0, hi = t.length();
                while (lo < hi) {
                        int mid = (lo + hi) / 2;
                        String cand = t.substring(0, mid) + ell;
                        float cw = font.getStringWidth(cand) / 1000f * size;
                        if (cw <= maxWidth)
                                lo = mid + 1;
                        else
                                hi = mid;
                }
                int cut = Math.max(0, lo - 1);
                return t.substring(0, cut) + ell;
        }

        // =========================
        // HELPERS
        // =========================
        private String nvl(String s) {
                return s == null ? "" : s;
        }

        private void drawRect(PDPageContentStream cs, float x, float y, float w, float h, float lineW)
                        throws IOException {
                cs.setStrokingColor(0f, 0f, 0f);
                cs.setLineWidth(lineW);
                cs.addRect(x, y, w, h);
                cs.stroke();
                cs.setLineWidth(1.0f);
        }

        private void drawLine(PDPageContentStream cs, float x1, float y1, float x2, float y2, float lineW)
                        throws IOException {
                cs.setStrokingColor(0f, 0f, 0f);
                cs.setLineWidth(lineW);
                cs.moveTo(x1, y1);
                cs.lineTo(x2, y2);
                cs.stroke();
                cs.setLineWidth(1.0f);
        }

        private void fillRect(PDPageContentStream cs, float x, float y, float w, float h, float r, float g, float b)
                        throws IOException {
                cs.setNonStrokingColor(r, g, b);
                cs.addRect(x, y, w, h);
                cs.fill();
                cs.setNonStrokingColor(0f, 0f, 0f);
        }

        private void drawText(PDPageContentStream cs, String text, float x, float y,
                        PDType1Font font, int size) throws IOException {
                if (text == null || text.isBlank())
                        return;
                cs.beginText();
                cs.setFont(font, size);
                cs.newLineAtOffset(x, y);
                cs.showText(text);
                cs.endText();
        }

        private void drawCenteredText(PDPageContentStream cs, String text, float x, float y, float w,
                        PDType1Font font, int size) throws IOException {
                if (text == null || text.isBlank())
                        return;
                float tw = font.getStringWidth(text) / 1000f * size;
                float cx = x + (w - tw) / 2f;
                drawText(cs, text, cx, y, font, size);
        }

        private void drawCenteredTextColored(PDPageContentStream cs, String text, float x, float y, float w,
                        PDType1Font font, int size,
                        float r, float g, float b) throws IOException {
                if (text == null || text.isBlank())
                        return;
                float tw = font.getStringWidth(text) / 1000f * size;
                float cx = x + (w - tw) / 2f;
                cs.setNonStrokingColor(r, g, b);
                drawText(cs, text, cx, y, font, size);
                cs.setNonStrokingColor(0f, 0f, 0f);
        }

        private void drawRightText(PDPageContentStream cs, String text, float rightX, float y,
                        PDType1Font font, int size) throws IOException {
                if (text == null || text.isBlank())
                        return;
                float tw = font.getStringWidth(text) / 1000f * size;
                float x = rightX - tw;
                drawText(cs, text, x, y, font, size);
        }
}
