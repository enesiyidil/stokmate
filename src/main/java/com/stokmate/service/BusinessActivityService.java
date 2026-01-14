package com.stokmate.service;

import com.stokmate.domain.BusinessActivity;
import com.stokmate.repository.BusinessActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessActivityService {

    private final BusinessActivityRepository businessActivityRepository;

    public Page<BusinessActivity> getAllActivities(Pageable pageable, String category, String search) {
        // category here maps to 'domain' (ORDER or SALE)
        // If category is "ALL" or empty, we pass null to repo

        String domainFilter = null;
        if (category != null && !category.isEmpty() && !category.equalsIgnoreCase("ALL")) {
            if (category.equalsIgnoreCase("ORDER") || category.equalsIgnoreCase("SALE")) {
                domainFilter = category.toUpperCase();
            }
        }

        String searchPattern = null;
        if (search != null && !search.trim().isEmpty()) {
            searchPattern = "%" + search.trim().toLowerCase() + "%";
        }

        return businessActivityRepository.findAllWithFilters(domainFilter, searchPattern, pageable);
    }
}
