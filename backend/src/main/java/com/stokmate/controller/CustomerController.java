package com.stokmate.controller;

import com.stokmate.dto.customer.CustomerRequest;
import com.stokmate.dto.customer.CustomerResponse;
import com.stokmate.service.CustomerService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PostMapping
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request) {
        return customerService.create(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable("id") UUID id, @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") UUID id) {
        customerService.delete(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER','DEPO')")
    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable("id") UUID id) {
        return customerService.get(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER','DEPO')")
    @GetMapping
    public Page<CustomerResponse> list(Pageable pageable) {
        return customerService.list(pageable);
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER','DEPO')")
    @GetMapping("/search")
    public java.util.List<CustomerResponse> search(@org.springframework.web.bind.annotation.RequestParam String query) {
        return customerService.searchByName(query);
    }
}
