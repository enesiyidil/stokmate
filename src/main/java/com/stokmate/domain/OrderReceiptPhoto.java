package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/**
 * OrderReceiptPhoto stores metadata about photos uploaded during product
 * receipt.
 * Actual photo files are stored in MinIO.
 */
@Entity
@Table(name = "order_receipt_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReceiptPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_receipt_id", nullable = false)
    private OrderReceipt orderReceipt;

    @Column(nullable = false, length = 500)
    private String fileKey;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column
    private Long fileSize;
}
