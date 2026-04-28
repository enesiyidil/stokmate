package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.balance.*;
import com.stokmate.exception.ResourceNotFoundException;
import com.stokmate.mapper.BalanceLedgerMapper;
import com.stokmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BalanceLedgerService {

    private final BalanceLedgerRepository balanceLedgerRepository;
    private final BalancePaymentRepository balancePaymentRepository;
    private final BalanceActivityRepository balanceActivityRepository;
    private final BalanceLedgerMapper balanceLedgerMapper;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final OrderActivityRepository orderActivityRepository;
    private final SaleRepository saleRepository;
    private final SaleEventRepository saleEventRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BalanceLedgerResponse> getAll(String search, String status, LocalDate dueDateFrom,
            LocalDate dueDateTo) {
        BalanceLedgerStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            statusEnum = BalanceLedgerStatus.valueOf(status);
        }
        String searchParam = (search != null && !search.trim().isEmpty()) ? "%" + search.trim().toLowerCase() + "%"
                : null;

        List<BalanceLedger> ledgers = balanceLedgerRepository.findAllWithFilters(
                statusEnum, searchParam, dueDateFrom, dueDateTo);
        return balanceLedgerMapper.toResponseList(ledgers);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<BalanceLedgerResponse> getAllPaged(
            String search, String status, LocalDate dueDateFrom, LocalDate dueDateTo,
            org.springframework.data.domain.Pageable pageable) {
        BalanceLedgerStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            statusEnum = BalanceLedgerStatus.valueOf(status);
        }
        String searchParam = (search != null && !search.trim().isEmpty()) ? "%" + search.trim().toLowerCase() + "%"
                : null;
        return balanceLedgerRepository.findPagedWithFilters(statusEnum, searchParam, dueDateFrom, dueDateTo, pageable)
                .map(balanceLedgerMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public BalanceLedgerResponse getById(UUID id) {
        BalanceLedger ledger = balanceLedgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bakiye kaydı bulunamadı: " + id));
        return balanceLedgerMapper.toResponse(ledger);
    }

    @Transactional
    public BalanceLedgerResponse create(BalanceLedgerRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Müşteri bulunamadı: " + request.getCustomerId()));

        ContractType contractType = ContractType.valueOf(request.getContractType());
        BigDecimal totalAmount;
        String contractNo;

        if (contractType == ContractType.SALE) {
            Sale sale = saleRepository.findById(request.getContractId())
                    .orElseThrow(() -> new ResourceNotFoundException("Satış bulunamadı: " + request.getContractId()));
            totalAmount = sale.getTotalNet();
            contractNo = sale.getContractNo() != null ? sale.getContractNo() : sale.getSaleNo();
        } else {
            Order order = orderRepository.findById(request.getContractId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + request.getContractId()));
            // Calculate total from order products' grossPrice
            totalAmount = order.getProducts().stream()
                    .map(p -> p.getGrossPrice() != null ? p.getGrossPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            contractNo = order.getProsapContractNo() != null ? order.getProsapContractNo() : order.getOrderNo();
        }

        BigDecimal paidAmount = request.getPaidAmount();
        BigDecimal remainingAmount = totalAmount.subtract(paidAmount);

        if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Ödenen tutar toplam tutardan büyük olamaz");
        }

        BalanceLedgerStatus initialStatus = remainingAmount.compareTo(BigDecimal.ZERO) == 0
                ? BalanceLedgerStatus.CLOSED
                : BalanceLedgerStatus.OPEN;

        BalanceLedger ledger = BalanceLedger.builder()
                .customer(customer)
                .contractType(contractType)
                .saleId(contractType == ContractType.SALE ? request.getContractId() : null)
                .orderId(contractType == ContractType.ORDER ? request.getContractId() : null)
                .contractNo(contractNo)
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .remainingAmount(remainingAmount)
                .dueDate(request.getDueDate())
                .status(initialStatus)
                .notes(request.getNotes())
                .payments(new ArrayList<>())
                .build();

        BalanceLedger saved = balanceLedgerRepository.save(ledger);

        // Log initial payment if > 0
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            User currentUser = getCurrentUser();
            BalancePayment initialPayment = BalancePayment.builder()
                    .balanceLedger(saved)
                    .amount(paidAmount)
                    .paidBy(currentUser)
                    .notes("İlk ödeme")
                    .nextDueDate(request.getDueDate())
                    .build();
            balancePaymentRepository.save(initialPayment);
        }

        // Activity log
        String description = String.format("Bakiye kaydı oluşturuldu: %s %s - %s, Toplam: %s, Ödenen: %s, Kalan: %s",
                customer.getFirstName(), customer.getLastName(), contractNo,
                formatCurrency(totalAmount), formatCurrency(paidAmount), formatCurrency(remainingAmount));
        logActivity(saved, ActivityType.BALANCE_CREATED, description);

        log.info("Balance ledger created: {} for customer {} {}", saved.getId(), customer.getFirstName(),
                customer.getLastName());
        return balanceLedgerMapper.toResponse(saved);
    }

    @Transactional
    public BalanceLedgerResponse addPayment(UUID id, BalancePaymentRequest request) {
        BalanceLedger ledger = balanceLedgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bakiye kaydı bulunamadı: " + id));

        if (ledger.getStatus() == BalanceLedgerStatus.CLOSED) {
            throw new IllegalArgumentException("Kapalı bakiye kaydına ödeme eklenemez");
        }

        BigDecimal paymentAmount = request.getAmount();
        if (paymentAmount.compareTo(ledger.getRemainingAmount()) > 0) {
            throw new IllegalArgumentException("Ödeme tutarı kalan bakiyeden büyük olamaz");
        }

        User currentUser = getCurrentUser();

        // Create payment record
        BalancePayment payment = BalancePayment.builder()
                .balanceLedger(ledger)
                .amount(paymentAmount)
                .paidBy(currentUser)
                .notes(request.getNotes())
                .nextDueDate(request.getNextDueDate())
                .build();
        balancePaymentRepository.save(payment);

        // Update ledger
        BigDecimal newPaidAmount = ledger.getPaidAmount().add(paymentAmount);
        BigDecimal newRemainingAmount = ledger.getTotalAmount().subtract(newPaidAmount);
        ledger.setPaidAmount(newPaidAmount);
        ledger.setRemainingAmount(newRemainingAmount);

        // Update due date if provided
        if (request.getNextDueDate() != null) {
            ledger.setDueDate(request.getNextDueDate());
        }

        // Check if fully paid
        if (newRemainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            ledger.setStatus(BalanceLedgerStatus.CLOSED);

            String closeDesc = String.format("Bakiye kaydı kapandı: %s %s - %s, Toplam ödenen: %s",
                    ledger.getCustomer().getFirstName(), ledger.getCustomer().getLastName(),
                    ledger.getContractNo(), formatCurrency(newPaidAmount));
            logActivity(ledger, ActivityType.BALANCE_CLOSED, closeDesc);
        }

        BalanceLedger updated = balanceLedgerRepository.save(ledger);

        // Activity log
        String description = String.format("Ödeme eklendi: %s - %s %s, Ödeme: %s, Kalan: %s",
                ledger.getContractNo(),
                ledger.getCustomer().getFirstName(), ledger.getCustomer().getLastName(),
                formatCurrency(paymentAmount), formatCurrency(newRemainingAmount));
        logActivity(updated, ActivityType.BALANCE_PAYMENT_ADDED, description);

        log.info("Payment added to balance ledger {}: amount={}, remaining={}", id, paymentAmount, newRemainingAmount);
        return balanceLedgerMapper.toResponse(updated);
    }

    @Transactional
    public BalanceLedgerResponse update(UUID id, BalanceLedgerUpdateRequest request) {
        BalanceLedger ledger = balanceLedgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bakiye kaydı bulunamadı: " + id));

        StringBuilder changes = new StringBuilder();

        if (request.getNotes() != null) {
            ledger.setNotes(request.getNotes());
            changes.append("Notlar güncellendi. ");
        }

        if (request.getTotalAmount() != null) {
            BigDecimal oldTotal = ledger.getTotalAmount();
            ledger.setTotalAmount(request.getTotalAmount());
            ledger.setRemainingAmount(request.getTotalAmount().subtract(ledger.getPaidAmount()));
            changes.append(String.format("Toplam tutar: %s → %s. ", formatCurrency(oldTotal),
                    formatCurrency(request.getTotalAmount())));

            // Re-check if should be closed/opened
            if (ledger.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
                ledger.setStatus(BalanceLedgerStatus.CLOSED);
            } else {
                ledger.setStatus(BalanceLedgerStatus.OPEN);
            }
        }

        if (request.getDueDate() != null) {
            ledger.setDueDate(request.getDueDate());
            changes.append("Vade tarihi güncellendi. ");
        }

        BalanceLedger updated = balanceLedgerRepository.save(ledger);

        // Activity log
        String description = String.format("Bakiye kaydı güncellendi: %s %s - %s. %s",
                ledger.getCustomer().getFirstName(), ledger.getCustomer().getLastName(),
                ledger.getContractNo(), changes.toString().trim());
        logActivity(updated, ActivityType.BALANCE_UPDATED, description);

        log.info("Balance ledger updated: {}", id);
        return balanceLedgerMapper.toResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        BalanceLedger ledger = balanceLedgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bakiye kaydı bulunamadı: " + id));

        String customerName = ledger.getCustomer().getFirstName() + " " + ledger.getCustomer().getLastName();
        String contractNo = ledger.getContractNo();

        // Delete activities first
        balanceActivityRepository.deleteByBalanceLedgerId(id);

        balanceLedgerRepository.deleteById(id);
        log.info("Balance ledger deleted: {} - {} ({}), Total: {}, Remaining: {}",
                id, customerName, contractNo,
                formatCurrency(ledger.getTotalAmount()), formatCurrency(ledger.getRemainingAmount()));
    }

    @Transactional(readOnly = true)
    public List<ContractOption> getContractsByCustomerId(UUID customerId) {
        List<ContractOption> contracts = new ArrayList<>();

        // Get Sales for this customer
        List<Sale> sales = saleRepository.findByCustomerId(customerId);
        for (Sale sale : sales) {
            String label = String.format("Stoklu Satış - %s (%s)",
                    sale.getContractNo() != null ? sale.getContractNo() : sale.getSaleNo(),
                    sale.getSaleNo());
            contracts.add(ContractOption.builder()
                    .id(sale.getId())
                    .contractNo(sale.getContractNo() != null ? sale.getContractNo() : sale.getSaleNo())
                    .type("SALE")
                    .label(label)
                    .totalAmount(sale.getTotalNet())
                    .build());
        }

        // Get customer-specific Orders
        List<Order> orders = orderRepository.findByCustomerId(customerId);
        for (Order order : orders) {
            if (order.getOrderType() == OrderType.CUSTOMER_SPECIFIC) {
                BigDecimal totalAmount = order.getProducts().stream()
                        .map(p -> p.getGrossPrice() != null ? p.getGrossPrice() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                String contractNo = order.getProsapContractNo() != null ? order.getProsapContractNo()
                        : order.getOrderNo();
                String label = String.format("Müşteri Özel Sipariş - %s (%s)", contractNo, order.getOrderNo());
                contracts.add(ContractOption.builder()
                        .id(order.getId())
                        .contractNo(contractNo)
                        .type("ORDER")
                        .label(label)
                        .totalAmount(totalAmount)
                        .build());
            }
        }

        return contracts;
    }

    // --- Helpers ---

    private void logActivity(BalanceLedger ledger, ActivityType activityType, String description) {
        User currentUser = getCurrentUser();
        BalanceActivity activity = BalanceActivity.builder()
                .balanceLedger(ledger)
                .user(currentUser)
                .activityType(activityType)
                .description(description)
                .build();
        balanceActivityRepository.save(activity);

        // Also log to OrderEvent / SaleEvent if applicable so it shows up in detail
        // pages
        if (ledger.getContractType() == ContractType.ORDER && ledger.getOrderId() != null) {
            try {
                com.stokmate.domain.OrderActivity orderActivity = com.stokmate.domain.OrderActivity.builder()
                        .order(orderRepository.findById(ledger.getOrderId()).orElse(null))
                        .user(currentUser)
                        .activityType(activityType)
                        .description(description)
                        .build();
                if (orderActivity.getOrder() != null) {
                    orderActivityRepository.save(orderActivity);
                }
            } catch (Exception e) {
                log.error("Failed to log OrderActivity for balance ledger {}: {}", ledger.getId(), e.getMessage());
            }
        } else if (ledger.getContractType() == ContractType.SALE && ledger.getSaleId() != null) {
            try {
                java.util.Map<String, Object> eventData = new java.util.HashMap<>();
                eventData.put("description", description);
                eventData.put("activityType", activityType.name());
                eventData.put("totalAmount",
                        ledger.getTotalAmount() != null ? ledger.getTotalAmount().toString() : "0");
                eventData.put("remainingAmount",
                        ledger.getRemainingAmount() != null ? ledger.getRemainingAmount().toString() : "0");

                com.stokmate.domain.SaleEvent saleEvent = com.stokmate.domain.SaleEvent.builder()
                        .sale(saleRepository.findById(ledger.getSaleId()).orElse(null))
                        .eventType(activityType.name())
                        .eventData(eventData)
                        .description(description)
                        .user(currentUser)
                        .createdAt(java.time.LocalDateTime.now())
                        .build();
                if (saleEvent.getSale() != null) {
                    saleEventRepository.save(saleEvent);
                }
            } catch (Exception e) {
                log.error("Failed to log SaleEvent for balance ledger {}: {}", ledger.getId(), e.getMessage());
            }
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null)
            return "0 ₺";
        return String.format("%,.2f ₺", amount);
    }
}
