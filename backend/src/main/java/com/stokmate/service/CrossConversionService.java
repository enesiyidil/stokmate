package com.stokmate.service;

import com.stokmate.domain.ActivityType;
import com.stokmate.domain.Brand;
import com.stokmate.domain.CrossConversion;
import com.stokmate.domain.Customer;
import com.stokmate.domain.Order;
import com.stokmate.dto.crossconversion.CrossConversionRequest;
import com.stokmate.dto.crossconversion.CrossConversionResponse;
import com.stokmate.exception.ResourceNotFoundException;
import com.stokmate.mapper.CrossConversionMapper;
import com.stokmate.repository.CrossConversionRepository;
import com.stokmate.repository.CustomerRepository;
import com.stokmate.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrossConversionService {

    private final CrossConversionRepository crossConversionRepository;
    private final CrossConversionMapper crossConversionMapper;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final OrderActivityService orderActivityService;

    @Transactional(readOnly = true)
    public List<CrossConversionResponse> getAll() {
        return crossConversionRepository.findAll().stream()
                .map(crossConversionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<CrossConversionResponse> getAllPaged(
            String search, String sourceBrandStr, String targetBrandStr,
            org.springframework.data.domain.Pageable pageable) {
        String searchParam = null;
        if (search != null && !search.isBlank()) {
            searchParam = "%" + search.toLowerCase() + "%";
        }
        Brand sourceBrand = (sourceBrandStr != null && !sourceBrandStr.isBlank()) ? Brand.valueOf(sourceBrandStr) : null;
        Brand targetBrand = (targetBrandStr != null && !targetBrandStr.isBlank()) ? Brand.valueOf(targetBrandStr) : null;
        return crossConversionRepository.findPagedWithSearch(searchParam, sourceBrand, targetBrand, pageable)
                .map(crossConversionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public CrossConversionResponse getById(UUID id) {
        CrossConversion entity = crossConversionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Çapraz dönüştürme bulunamadı: " + id));
        return crossConversionMapper.toResponse(entity);
    }

    @Transactional
    public CrossConversionResponse create(CrossConversionRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Müşteri bulunamadı: " + request.getCustomerId()));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sipariş bulunamadı: " + request.getOrderId()));

        Brand sourceBrand = Brand.valueOf(request.getSourceBrand());
        Brand targetBrand = Brand.valueOf(request.getTargetBrand());

        if (sourceBrand == targetBrand) {
            throw new IllegalArgumentException("Nereden ve nereye markası aynı olamaz");
        }

        CrossConversion entity = CrossConversion.builder()
                .customer(customer)
                .order(order)
                .sourceBrand(sourceBrand)
                .targetBrand(targetBrand)
                .notes(request.getNotes())
                .build();

        CrossConversion saved = crossConversionRepository.save(entity);
        log.info("Cross conversion created: {} -> {}", sourceBrand, targetBrand);

        // Log activity to the related order
        String description = String.format("Çapraz dönüştürme oluşturuldu: %s → %s (%s %s)",
                getBrandDisplayName(sourceBrand), getBrandDisplayName(targetBrand),
                customer.getFirstName(), customer.getLastName());
        orderActivityService.logActivity(order, ActivityType.CROSS_CONVERSION_CREATED, description);

        return crossConversionMapper.toResponse(saved);
    }

    @Transactional
    public CrossConversionResponse update(UUID id, CrossConversionRequest request) {
        CrossConversion entity = crossConversionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Çapraz dönüştürme bulunamadı: " + id));

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Müşteri bulunamadı: " + request.getCustomerId()));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sipariş bulunamadı: " + request.getOrderId()));

        Brand sourceBrand = Brand.valueOf(request.getSourceBrand());
        Brand targetBrand = Brand.valueOf(request.getTargetBrand());

        if (sourceBrand == targetBrand) {
            throw new IllegalArgumentException("Nereden ve nereye markası aynı olamaz");
        }

        entity.setCustomer(customer);
        entity.setOrder(order);
        entity.setSourceBrand(sourceBrand);
        entity.setTargetBrand(targetBrand);
        entity.setNotes(request.getNotes());

        CrossConversion updated = crossConversionRepository.save(entity);
        log.info("Cross conversion updated: {}", id);

        // Log activity to the related order
        String description = String.format("Çapraz dönüştürme güncellendi: %s → %s (%s %s)",
                getBrandDisplayName(sourceBrand), getBrandDisplayName(targetBrand),
                customer.getFirstName(), customer.getLastName());
        orderActivityService.logActivity(order, ActivityType.CROSS_CONVERSION_UPDATED, description);

        return crossConversionMapper.toResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        CrossConversion entity = crossConversionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Çapraz dönüştürme bulunamadı: " + id));

        Order order = entity.getOrder();
        Customer customer = entity.getCustomer();
        Brand sourceBrand = entity.getSourceBrand();
        Brand targetBrand = entity.getTargetBrand();

        crossConversionRepository.deleteById(id);
        log.info("Cross conversion deleted: {}", id);

        // Log activity to the related order
        String description = String.format("Çapraz dönüştürme silindi: %s → %s (%s %s)",
                getBrandDisplayName(sourceBrand), getBrandDisplayName(targetBrand),
                customer.getFirstName(), customer.getLastName());
        orderActivityService.logActivity(order, ActivityType.CROSS_CONVERSION_DELETED, description);
    }

    private String getBrandDisplayName(Brand brand) {
        return brand != null ? brand.getDisplayName() : "";
    }
}
