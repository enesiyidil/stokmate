package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.exception.BadRequestException;
import com.stokmate.repository.OrderProductAllocationRepository;
import com.stokmate.repository.ProductPriceHistoryRepository;
import com.stokmate.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductAllocationService {

    private final ProductRepository productRepository;
    private final ProductPriceHistoryRepository productPriceHistoryRepository;
    private final OrderProductAllocationRepository orderProductAllocationRepository;
    private final com.stokmate.repository.SaleProductAllocationRepository saleProductAllocationRepository;
    private final com.stokmate.repository.ProductEventRepository productEventRepository;
    private final ProductService productService;

    /**
     * Allocate stock for an order product using FIFO (First-In First-Out) strategy.
     * Decrements stock from Product and ProductPriceHistory records.
     */
    @Transactional
    public void allocateStock(OrderProduct orderProduct, User user) {
        // 1. Find the product
        Product product = productRepository.findByCode(orderProduct.getProductCode())
                .orElseThrow(() -> new BadRequestException("Product not found: " + orderProduct.getProductCode()));

        BigDecimal quantityToAllocate = orderProduct.getQuantity();

        // 2. Check main stock availability
        if (product.getStockQuantity().compareTo(quantityToAllocate) < 0) {
            throw new BadRequestException("Insufficient stock for product: " + product.getName() +
                    ". Requested: " + quantityToAllocate + ", Available: " + product.getStockQuantity());
        }

        // 3. Decrement main stock
        product.setStockQuantity(product.getStockQuantity().subtract(quantityToAllocate));
        productRepository.save(product);
        log.info("Decremented main stock for product {}. New stock: {}", product.getCode(), product.getStockQuantity());

        // Check if stock fell below minimum level and notify
        productService.checkAndNotifyLowStock(product);

        // 4. FIFO Allocation from Price History (reservation only, events created at
        // finalization)
        List<ProductPriceHistory> historyRecords = productPriceHistoryRepository
                .findByProductIdAndRemainingQuantityGreaterThanOrderByCreatedAtAsc(product.getId(), BigDecimal.ZERO);

        BigDecimal remainingToAllocate = quantityToAllocate;

        for (ProductPriceHistory history : historyRecords) {
            if (remainingToAllocate.compareTo(BigDecimal.ZERO) <= 0)
                break;

            BigDecimal availableInHistory = history.getRemainingQuantity();
            BigDecimal amountToTake = remainingToAllocate.min(availableInHistory);

            // Update history record (reserve stock)
            history.setRemainingQuantity(availableInHistory.subtract(amountToTake));
            productPriceHistoryRepository.save(history);

            // Create allocation record to track which price history was used
            OrderProductAllocation allocation = OrderProductAllocation.builder()
                    .orderProduct(orderProduct)
                    .productPriceHistory(history)
                    .quantity(amountToTake)
                    .build();
            orderProductAllocationRepository.save(allocation);

            remainingToAllocate = remainingToAllocate.subtract(amountToTake);
            log.info("Reserved {} from history batch {} (Date: {}, Price: {}). Remaining in batch: {}",
                    amountToTake, history.getId(), history.getCreatedAt(), history.getNetPrice(),
                    history.getRemainingQuantity());
        }

        if (remainingToAllocate.compareTo(BigDecimal.ZERO) > 0) {
            log.warn(
                    "Full FIFO allocation not possible for product {}. Shortage: {}. Main stock was sufficient but history records were missing/incomplete.",
                    product.getCode(), remainingToAllocate);
        }
    }

    /**
     * Deallocate stock when an order is cancelled.
     * Restores stock to Product and ProductPriceHistory records.
     */
    @Transactional
    public void deallocateStock(OrderProduct orderProduct) {
        // 1. Find product
        Product product = productRepository.findByCode(orderProduct.getProductCode())
                .orElse(null); // Product might have been deleted, though unlikely

        if (product != null) {
            // Restore main stock
            product.setStockQuantity(product.getStockQuantity().add(orderProduct.getQuantity()));
            productRepository.save(product);
            log.info("Restored main stock for product {}. New stock: {}", product.getCode(),
                    product.getStockQuantity());
        }

        // 2. Restore history records from allocations
        List<OrderProductAllocation> allocations = orderProductAllocationRepository.findByOrderProduct(orderProduct);

        for (OrderProductAllocation allocation : allocations) {
            ProductPriceHistory history = allocation.getProductPriceHistory();

            // Restore quantity to history
            history.setRemainingQuantity(history.getRemainingQuantity().add(allocation.getQuantity()));
            productPriceHistoryRepository.save(history); // Optimized: could batch save

            // Delete allocation record
            orderProductAllocationRepository.delete(allocation);

            log.info("Restored {} to history batch {}", allocation.getQuantity(), history.getId());
        }
    }

    /**
     * Allocate stock for a sale product using FIFO.
     */
    @Transactional
    public void allocateStock(SaleProduct saleProduct, User user) {
        // 1. Find the product
        Product product = saleProduct.getProduct();

        // Re-fetch product to ensure latest stock data (if not fetched with lock)
        product = productRepository.findById(product.getId())
                .orElseThrow(() -> new BadRequestException("Product not found: " + saleProduct.getProduct().getCode()));

        BigDecimal quantityToAllocate = BigDecimal.valueOf(saleProduct.getQuantity());

        // 2. Check main stock availability
        if (product.getStockQuantity().compareTo(quantityToAllocate) < 0) {
            throw new BadRequestException("Insufficient stock for product: " + product.getName() +
                    ". Requested: " + quantityToAllocate + ", Available: " + product.getStockQuantity());
        }

        // 3. Decrement main stock
        product.setStockQuantity(product.getStockQuantity().subtract(quantityToAllocate));
        productRepository.save(product);
        log.info("Decremented main stock for sale product {}. New stock: {}", product.getCode(),
                product.getStockQuantity());

        // Check if stock fell below minimum level and notify
        productService.checkAndNotifyLowStock(product);

        // 4. FIFO Allocation from Price History
        List<ProductPriceHistory> historyRecords = productPriceHistoryRepository
                .findByProductIdAndRemainingQuantityGreaterThanOrderByCreatedAtAsc(product.getId(), BigDecimal.ZERO);

        BigDecimal remainingToAllocate = quantityToAllocate;

        for (ProductPriceHistory history : historyRecords) {
            if (remainingToAllocate.compareTo(BigDecimal.ZERO) <= 0)
                break;

            BigDecimal availableInHistory = history.getRemainingQuantity();
            BigDecimal amountToTake = remainingToAllocate.min(availableInHistory);

            // Update history record (reserve stock)
            history.setRemainingQuantity(availableInHistory.subtract(amountToTake));
            productPriceHistoryRepository.save(history);

            // Create allocation record to track which price history was used
            com.stokmate.domain.SaleProductAllocation allocation = com.stokmate.domain.SaleProductAllocation.builder()
                    .saleProduct(saleProduct)
                    .productPriceHistory(history)
                    .quantity(amountToTake)
                    .build();
            saleProductAllocationRepository.save(allocation);

            remainingToAllocate = remainingToAllocate.subtract(amountToTake);
            log.info("Reserved {} from history batch {} (Date: {}, Price: {}) for Sale {}. Remaining in batch: {}",
                    amountToTake, history.getId(), history.getCreatedAt(), history.getNetPrice(),
                    saleProduct.getSale().getSaleNo(), history.getRemainingQuantity());
        }

        if (remainingToAllocate.compareTo(BigDecimal.ZERO) > 0) {
            log.warn(
                    "Full FIFO allocation not possible for sale product {}. Shortage: {}. Main stock was sufficient but history records were missing/incomplete.",
                    product.getCode(), remainingToAllocate);
        }
    }

    /**
     * Deallocate stock when a sale is cancelled.
     */
    @Transactional
    public void deallocateStock(SaleProduct saleProduct) {
        // 1. Find product
        Product product = saleProduct.getProduct();
        product = productRepository.findById(product.getId()).orElse(null);

        if (product != null) {
            // Restore main stock
            product.setStockQuantity(product.getStockQuantity().add(BigDecimal.valueOf(saleProduct.getQuantity())));
            productRepository.save(product);
            log.info("Restored main stock for sale product {}. New stock: {}", product.getCode(),
                    product.getStockQuantity());
        }

        // 2. Restore history records from allocations
        List<com.stokmate.domain.SaleProductAllocation> allocations = saleProductAllocationRepository
                .findBySaleProduct(saleProduct);

        for (com.stokmate.domain.SaleProductAllocation allocation : allocations) {
            ProductPriceHistory history = allocation.getProductPriceHistory();

            // Restore quantity to history
            history.setRemainingQuantity(history.getRemainingQuantity().add(allocation.getQuantity()));
            productPriceHistoryRepository.save(history);

            // Delete allocation record
            saleProductAllocationRepository.delete(allocation);

            log.info("Restored {} to history batch {} for Sale", allocation.getQuantity(), history.getId());
        }
    }
}
