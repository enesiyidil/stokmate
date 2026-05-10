package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.sale.SaleProductRequest;
import com.stokmate.dto.sale.SaleRequest;
import com.stokmate.dto.sale.SaleResponse;
import com.stokmate.dto.sale.SaleEventResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.SaleEventMapper;
import com.stokmate.mapper.SaleMapper;
import com.stokmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleEventRepository saleEventRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    private final SaleMapper saleMapper;
    private final SaleEventMapper saleEventMapper;
    private final StorageService storageService;
    private final ProductAllocationService productAllocationService;

    @Transactional
    public SaleResponse create(SaleRequest request, User user) {
        log.info("Creating new sale for customer: {}", request.getCustomerId());

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        User consultant;
        if (request.getSalesConsultantId() != null) {
            consultant = userRepository.findById(request.getSalesConsultantId())
                    .orElseThrow(() -> new NotFoundException("Sales consultant not found"));
        } else {
            consultant = user;
        }

        Sale sale = new Sale();
        sale.setSaleNo(generateSaleNo());
        sale.setCustomer(customer);
        sale.setSalesConsultant(consultant);
        sale.setContractNo(request.getContractNo());
        sale.setSaleDate(request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now());
        sale.setStatus(request.getStatus() != null ? request.getStatus() : SaleStatus.DEVAM_EDIYOR);
        sale.setNotes(request.getNotes());
        sale.setCreatedBy(user.getEmail());
        sale.setCreatedAt(java.time.Instant.now());

        // Process products
        if (request.getProducts() != null) {
            for (SaleProductRequest spr : request.getProducts()) {
                Product product = productRepository.findById(spr.getProductId())
                        .orElseThrow(() -> new NotFoundException("Product not found: " + spr.getProductId()));

                SaleProduct saleProduct = new SaleProduct();
                saleProduct.setProduct(product);
                saleProduct.setQuantity(spr.getQuantity());
                saleProduct.setUnitPriceExcludingVat(spr.getUnitPriceExcludingVat());
                saleProduct.setVatRate(spr.getVatRate());
                saleProduct.setInternetSalesPrice(spr.getInternetSalesPrice());
                saleProduct.setCreatedAt(java.time.Instant.now());
                saleProduct.setCreatedBy(user.getEmail());

                sale.addProduct(saleProduct);
            }
        }

        calculateTotals(sale, request.getProducts());

        Sale savedSale = saleRepository.save(sale);

        // Allocate stock for each product (FIFO)
        if (savedSale.getProducts() != null) {
            for (SaleProduct sp : savedSale.getProducts()) {
                try {
                    productAllocationService.allocateStock(sp, user);
                } catch (Exception e) {
                    log.error("Failed to allocate stock for sale product " + sp.getId(), e);
                    // Depending on requirements, we might want to fail the whole transaction
                    // throw new RuntimeException("Stock allocation failed", e);
                }
            }
        }

        // Automatic shipment creation logic removed as per new requirement

        // Log event
        logEvent(savedSale, "CREATED", "Satış oluşturuldu ve sevk talebi açıldı", user);

        return saleMapper.toResponse(savedSale);
    }

    @Transactional(readOnly = true)
    public SaleResponse getById(UUID id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sale not found"));
        return saleMapper.toResponse(sale);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> list(SaleStatus status, UUID consultantId) {
        return saleRepository.findFiltered(status, consultantId).stream()
                .map(saleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<SaleResponse> listPaged(
            String statusGroup, UUID consultantId, String search,
            org.springframework.data.domain.Pageable pageable) {
        String searchParam = null;
        if (search != null && !search.isBlank()) {
            searchParam = "%" + search.toLowerCase() + "%";
        }
        return saleRepository.findPagedWithFilters(statusGroup, consultantId, searchParam, pageable)
                .map(saleMapper::toResponse);
    }

    @Transactional
    public SaleResponse updateStatus(UUID id, SaleStatus status, User user) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sale not found"));

        SaleStatus oldStatus = sale.getStatus();
        sale.setStatus(status);
        saleRepository.save(sale);

        logEvent(sale, "STATUS_CHANGE",
                String.format("Durum değiştirildi: %s -> %s", oldStatus, status), user);

        return saleMapper.toResponse(sale);
    }

    @Transactional
    public SaleResponse uploadContract(UUID id, MultipartFile file, User user) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sale not found"));

        try {
            String fileKey = storageService.store(file, "contracts/" + id);
            sale.setContractFileKey(fileKey);
            saleRepository.save(sale);

            logEvent(sale, "CONTRACT_UPLOAD", "Sözleşme yüklendi: " + file.getOriginalFilename(), user);

            return saleMapper.toResponse(sale);
        } catch (Exception e) {
            log.error("Failed to upload contract", e);
            throw new BadRequestException("Failed to upload file");
        }
    }

    @Transactional
    public void deleteContract(UUID id, User user) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sale not found"));

        if (sale.getContractFileKey() != null) {
            storageService.delete(sale.getContractFileKey());
            sale.setContractFileKey(null);
            saleRepository.save(sale);

            logEvent(sale, "CONTRACT_DELETE", "Sözleşme silindi", user);
        }
    }

    public List<SaleEventResponse> getEvents(UUID id) {
        return saleEventRepository.findBySaleIdOrderByCreatedAtDesc(id).stream()
                .map(saleEventMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void logEvent(Sale sale, String type, String description, User user) {
        SaleEvent event = new SaleEvent();
        event.setSale(sale);
        event.setEventType(type);
        event.setDescription(description);
        event.setUser(user);
        event.setCreatedAt(LocalDateTime.now());
        saleEventRepository.save(event);
    }

    private String generateSaleNo() {
        return "SL-" + (100000 + new Random().nextInt(900000));
    }

    private void calculateTotals(Sale sale, List<SaleProductRequest> products) {
        java.math.BigDecimal totalGross = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalVat = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalNet = java.math.BigDecimal.ZERO;

        if (products != null) {
            for (SaleProductRequest spr : products) {
                java.math.BigDecimal quantity = java.math.BigDecimal.valueOf(spr.getQuantity());
                java.math.BigDecimal unitPrice = spr.getUnitPriceExcludingVat();
                java.math.BigDecimal vatRate = spr.getVatRate()
                        .divide(java.math.BigDecimal.valueOf(100));

                java.math.BigDecimal lineNet = unitPrice.multiply(quantity);
                java.math.BigDecimal lineVat = lineNet.multiply(vatRate);
                java.math.BigDecimal lineGross = lineNet.add(lineVat);

                totalNet = totalNet.add(lineNet);
                totalVat = totalVat.add(lineVat);
                totalGross = totalGross.add(lineGross);
            }
        }

        sale.setTotalGross(totalGross);
        sale.setTotalVat(totalVat);
        sale.setTotalNet(totalNet);
    }
}
