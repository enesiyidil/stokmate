package com.stokmate.service.spec;

import com.stokmate.domain.Product;
import com.stokmate.domain.Brand;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.math.BigDecimal;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class ProductSpecification {

    private ProductSpecification() {
    }

    public static Specification<Product> filter(
            String search,
            String brand,
            Boolean activeForSale,
            String stockFilter) {
        return (root, query, cb) -> {
            query.distinct(true);
            var predicates = new ArrayList<Predicate>();
            if (StringUtils.hasText(search)) {
                String likePattern = "%" + search.toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), likePattern);
                Predicate codeLike = cb.like(cb.lower(root.get("code")), likePattern);
                Predicate brandLike = cb.like(cb.lower(root.get("brand").as(String.class)), likePattern);
                predicates.add(cb.or(nameLike, codeLike, brandLike));
            }
            if (StringUtils.hasText(brand)) {
                if ("MARKASIZ".equalsIgnoreCase(brand)) {
                    predicates.add(cb.isNull(root.get("brand")));
                } else {
                    predicates.add(cb.equal(root.get("brand"), Brand.valueOf(brand)));
                }
            }
            if (activeForSale != null) {
                predicates.add(cb.equal(root.get("activeForSale"), activeForSale));
            }
            if (StringUtils.hasText(stockFilter)) {
                if ("IN_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(cb.greaterThan(root.get("stockQuantity"), BigDecimal.ZERO));
                } else if ("OUT_OF_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("stockQuantity"), BigDecimal.ZERO));
                }
            }
            // Exclude soft-deleted items
            predicates.add(cb.isFalse(root.get("isDeleted")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
