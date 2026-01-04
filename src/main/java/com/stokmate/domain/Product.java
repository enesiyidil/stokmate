package com.stokmate.domain;

import com.stokmate.domain.base.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "products")
public class Product extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;
    private String brand;

    private String imageUrl;

    @Column(nullable = false)
    private boolean activeForSale = true;

    @Column(nullable = false)
    private boolean customerOwned = false;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal arrivalPrice = BigDecimal.ZERO; // Geliş fiyatı (maliyet)

    // Internet satış fiyatı (referans için)
    @Column(precision = 19, scale = 2)
    private BigDecimal internetSalesPrice;

    @Column(precision = 19, scale = 2)
    private BigDecimal minStockLevel;

    @ElementCollection(fetch = FetchType.EAGER)
    private Set<String> keywords = new HashSet<>();

    @Version
    private Long version;
}
