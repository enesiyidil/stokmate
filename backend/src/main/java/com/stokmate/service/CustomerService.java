package com.stokmate.service;

import com.stokmate.domain.Customer;
import com.stokmate.dto.customer.CustomerRequest;
import com.stokmate.dto.customer.CustomerResponse;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.CustomerMapper;
import com.stokmate.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    public CustomerResponse create(CustomerRequest request) {
        Customer customer = customerMapper.toEntity(request);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    public CustomerResponse update(java.util.UUID id, CustomerRequest request) {
        Customer customer = getEntity(id);
        customerMapper.update(customer, request);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    public void delete(java.util.UUID id) {
        Customer customer = getEntity(id);
        // Soft delete: anonymize personal data
        customer.setIsDeleted(true);
        customer.setFirstName("Müşteri");
        customer.setLastName("");
        customer.setPhone(null);
        customer.setEmail(null);
        customer.setTcNo(null);
        customer.setCity(null);
        customer.setDistrict(null);
        customer.setNeighborhood(null);
        customer.setFullAddress(null);
        customerRepository.save(customer);
    }

    public CustomerResponse get(java.util.UUID id) {
        return customerMapper.toResponse(getEntity(id));
    }

    public Page<CustomerResponse> list(Pageable pageable) {
        return customerRepository.findByIsDeleted(false, pageable).map(customerMapper::toResponse);
    }

    public Page<CustomerResponse> listPaged(String search, Pageable pageable) {
        String searchParam = null;
        if (search != null && !search.isBlank()) {
            searchParam = "%" + search.toLowerCase() + "%";
        }
        return customerRepository.findPagedWithSearch(searchParam, pageable).map(customerMapper::toResponse);
    }

    public Customer getEntity(java.util.UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found"));
    }

    public java.util.List<CustomerResponse> searchByName(String query) {
        if (query == null || query.trim().isEmpty()) {
            return java.util.List.of();
        }

        String normalizedQuery = query.trim().toLowerCase();

        return customerRepository.findAll().stream()
                .filter(customer -> !customer.getIsDeleted()) // Exclude deleted customers
                .filter(customer -> {
                    String fullName = (customer.getFirstName() + " " + customer.getLastName()).toLowerCase();
                    return fullName.contains(normalizedQuery);
                })
                .map(customerMapper::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }
}
