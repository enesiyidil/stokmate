package com.stokmate.service.spec;

import com.stokmate.domain.Product;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class ProductSpecification {

    private ProductSpecification() {
    }

    public static Specification<Product> filter(String name, String brand, Boolean activeForSale) {
        return (root, query, cb) -> {
            query.distinct(true);
            var predicates = new ArrayList<Predicate>();
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (StringUtils.hasText(brand)) {
                predicates.add(cb.like(cb.lower(root.get("brand")), "%" + brand.toLowerCase() + "%"));
            }
            if (activeForSale != null) {
                predicates.add(cb.equal(root.get("activeForSale"), activeForSale));
            }
            // Exclude soft-deleted items
            predicates.add(cb.isFalse(root.get("isDeleted")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
