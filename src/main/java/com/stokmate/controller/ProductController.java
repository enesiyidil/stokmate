package com.stokmate.controller;

import com.stokmate.dto.product.ProductRequest;
import com.stokmate.dto.product.ProductResponse;
import com.stokmate.dto.product.ProductDetailsResponse;
import com.stokmate.dto.product.ProductEventResponse;
import com.stokmate.dto.product.ProductPriceHistoryResponse;
import com.stokmate.dto.product.StockAdjustmentRequest;
import com.stokmate.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ProductController {

    private final ProductService productService;

    // Create: OPERATIONS_MANAGER, DIRECTOR, MANAGER, ADMIN
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @PostMapping
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @PostMapping("/batch")
    public List<ProductResponse> createBatch(@Valid @RequestBody List<ProductRequest> requests) {
        return productService.createBatch(requests);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DEPO')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        productService.delete(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DEPO')")
    @PostMapping("/{id}/stock/increase")
    public ProductResponse increaseStock(@PathVariable UUID id, @Valid @RequestBody StockAdjustmentRequest request) {
        return productService.increaseStock(id, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DEPO')")
    @PostMapping("/{id}/stock/decrease")
    public ProductResponse decreaseStock(@PathVariable UUID id, @Valid @RequestBody StockAdjustmentRequest request) {
        return productService.decreaseStock(id, request);
    }

    // View: All authenticated users
    @GetMapping
    public Page<ProductResponse> list(@RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "activeForSale", required = false) Boolean activeForSale,
            @RequestParam(value = "stockFilter", required = false) String stockFilter,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return productService.list(search, brand, activeForSale, stockFilter, pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable UUID id) {
        return productService.get(id);
    }

    @GetMapping("/search")
    public Page<ProductResponse> search(@RequestParam("q") String q, Pageable pageable) {
        return productService.search(q, pageable);
    }

    @GetMapping("/similar")
    public Page<ProductResponse> similar(@RequestParam("name") String name, Pageable pageable) {
        return productService.similar(name, pageable);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @PostMapping("/{id}/image")
    public ProductResponse uploadImage(@PathVariable("id") UUID id, @RequestParam("file") MultipartFile file) {
        return productService.uploadImage(id, file);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DIRECTOR','OPERATIONS_MANAGER')")
    @DeleteMapping("/{id}/image")
    public ProductResponse deleteImage(@PathVariable("id") UUID id) {
        return productService.deleteImage(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/{id}/details")
    public ProductDetailsResponse getDetails(@PathVariable("id") UUID id) {
        return productService.getDetails(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/{id}/events")
    public List<ProductEventResponse> getEvents(@PathVariable("id") UUID id) {
        return productService.getEvents(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/{id}/price-history")
    public List<ProductPriceHistoryResponse> getPriceHistory(@PathVariable("id") UUID id) {
        return productService.getPriceHistory(id);
    }
}
