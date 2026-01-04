package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private ShoppingCart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice; // Manuel girilecek

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate; // Manuel girilecek

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount; // Otomatik hesaplanacak

    @Column(precision = 19, scale = 2)
    private BigDecimal internetSalesPrice; // Referans fiyat
}
