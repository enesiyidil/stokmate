package com.stokmate.service;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderProduct;
import com.stokmate.dto.order.ExcelExtractionResponse;
import com.stokmate.dto.order.OrderCreateRequest;
import com.stokmate.dto.order.OrderGroupData;
import com.stokmate.dto.order.OrderProductCreateRequest;
import com.stokmate.dto.order.OrderProductExcelRow;
import com.stokmate.dto.order.OrderResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.OrderMapper;
import com.stokmate.mapper.OrderProductMapper;
import com.stokmate.repository.OrderRepository;
import jakarta.transaction.Transactional;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.stokmate.domain.OrderStatus;
import com.stokmate.domain.ActivityType;
import com.stokmate.domain.Brand;
import com.stokmate.domain.Customer;
import com.stokmate.domain.Product;
import com.stokmate.domain.ProductArrival;
import com.stokmate.repository.CustomerRepository;
import com.stokmate.repository.ProductRepository;
import com.stokmate.repository.ProductArrivalRepository;
import com.stokmate.repository.ShipmentRepository;
import com.stokmate.repository.OrderNoteRepository;
import com.stokmate.mapper.CustomerMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final OrderProductMapper orderProductMapper;
    private final OrderActivityService orderActivityService;
    private final OrderNoteRepository orderNoteRepository;
    private final StorageService storageService;
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final ProductArrivalRepository productArrivalRepository;
    private final ProductRepository productRepository;
    private final com.stokmate.repository.OrderEventRepository orderEventRepository;
    private final com.stokmate.mapper.OrderEventMapper orderEventMapper;
    private final com.stokmate.repository.UserRepository userRepository;
    private final com.stokmate.repository.OrderProductRepository orderProductRepository;
    private final ProductAllocationService productAllocationService;
    private final ShipmentRepository shipmentRepository;
    private final com.stokmate.repository.ProductStockHistoryRepository productStockHistoryRepository;

    private static final DateTimeFormatter EXCEL_DATE_FORMATTER = DateTimeFormatter.ofPattern("d.M.yyyy",
            Locale.forLanguageTag("tr"));

    /**
     * Extract order data from Excel file
     * Auto-detects format based on file signature (magic bytes)
     */
    @Transactional
    public ExcelExtractionResponse extractFromExcel(MultipartFile file) {
        Workbook workbook = null;
        try {
            if (file == null || file.isEmpty()) {
                throw new BadRequestException("Excel file is required");
            }

            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                throw new BadRequestException("File name is required");
            }

            fileName = fileName.toLowerCase();
            if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
                throw new BadRequestException(
                        "Only .xlsx and .xls files are supported. Received: " + file.getOriginalFilename());
            }

            // Read file content
            byte[] fileContent = file.getBytes();
            if (fileContent.length == 0) {
                throw new BadRequestException("File is empty");
            }

            log.info("Reading Excel file: {} (size: {} bytes)", file.getOriginalFilename(), fileContent.length);

            // Detect actual format by file signature (magic bytes)
            boolean isXlsx = isXlsxFormat(fileContent);
            boolean isXls = isXlsFormat(fileContent);

            log.info("File signature detection: XLSX={}, XLS={}", isXlsx, isXls);

            // Try to open with detected format
            try {
                if (isXlsx || (!isXls && fileName.endsWith(".xlsx"))) {
                    log.info("Opening as XLSX format");
                    workbook = new XSSFWorkbook(new ByteArrayInputStream(fileContent));
                } else if (isXls || fileName.endsWith(".xls")) {
                    log.info("Opening as XLS format");
                    workbook = new HSSFWorkbook(new ByteArrayInputStream(fileContent));
                } else {
                    // Fallback: try WorkbookFactory for auto-detection
                    log.warn("Unknown file format, trying WorkbookFactory auto-detection...");
                    workbook = org.apache.poi.ss.usermodel.WorkbookFactory
                            .create(new ByteArrayInputStream(fileContent));
                }
            } catch (org.apache.poi.poifs.filesystem.NotOLE2FileException e) {
                // File extension says XLS but content is XLSX - retry
                log.warn("File claims to be XLS but appears to be XLSX, retrying...");
                try {
                    workbook = new XSSFWorkbook(new ByteArrayInputStream(fileContent));
                } catch (Exception e2) {
                    log.warn("Failed to read as XLSX, trying WorkbookFactory: {}", e2.getMessage());
                    try {
                        workbook = org.apache.poi.ss.usermodel.WorkbookFactory
                                .create(new ByteArrayInputStream(fileContent));
                    } catch (Exception e3) {
                        log.error("All Excel format attempts failed");
                        throw new BadRequestException(
                                "File format not recognized. Please save the file as a valid Excel file (.xls or .xlsx) in Excel application. "
                                        + e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to create workbook: {}", e.getMessage());
                log.warn("Trying WorkbookFactory as fallback...");
                try {
                    workbook = org.apache.poi.ss.usermodel.WorkbookFactory
                            .create(new ByteArrayInputStream(fileContent));
                } catch (Exception e2) {
                    log.error("WorkbookFactory also failed: {}", e2.getMessage());
                    throw new BadRequestException(
                            "Failed to read Excel file. Please ensure the file is a valid Excel format (.xls or .xlsx): "
                                    + e.getMessage());
                }
            }

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new BadRequestException("Excel file has no sheets");
            }

            log.info("Sheet found with {} rows", sheet.getLastRowNum() + 1);

            // Extract header row to get column indices
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Excel file is empty");
            }

            ColumnMapping columnMapping = mapExcelColumns(headerRow);

            // Group products by order number (same order no = same order)
            Map<String, OrderGroupData> orderGroups = new LinkedHashMap<>();

            // Process all data rows (starting from row 1, which is second row)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row dataRow = sheet.getRow(i);
                if (dataRow == null || isRowEmpty(dataRow)) {
                    continue;
                }

                // Get order number from this row
                String rowOrderNo = getCellValue(dataRow, columnMapping.orderNoIndex);
                if (rowOrderNo == null || rowOrderNo.trim().isEmpty()) {
                    log.warn("Skipping row {} - no order number found", i);
                    continue;
                }

                // Get or create order group for this order number
                OrderGroupData orderGroup = orderGroups.computeIfAbsent(rowOrderNo, key -> {
                    String prosapContractNo = getCellValue(dataRow, columnMapping.prosapContractNoIndex);
                    String prosapContractNameSurname = getCellValue(dataRow,
                            columnMapping.prosapContractNameSurnameIndex);
                    LocalDate orderDate = parseDateCell(dataRow, columnMapping.orderDateIndex);
                    String note = getCellValue(dataRow, columnMapping.noteIndex);

                    log.info("Creating new order group for order no: {}", rowOrderNo);
                    return OrderGroupData.builder()
                            .orderNo(rowOrderNo)
                            .prosapContractNo(prosapContractNo)
                            .prosapContractNameSurname(prosapContractNameSurname)
                            .orderDate(orderDate)
                            .shipmentNote(note)
                            .products(new java.util.ArrayList<>())
                            .build();
                });

                // Extract product from this row
                OrderProductExcelRow product = extractOrderProductFromRow(dataRow, columnMapping);
                if (product != null) {
                    orderGroup.addProduct(product);
                }
            }

            if (orderGroups.isEmpty()) {
                throw new BadRequestException("No orders found in Excel file");
            }

            int totalProducts = orderGroups.values().stream()
                    .mapToInt(og -> og.getProductCount())
                    .sum();

            log.info("Successfully extracted {} orders with {} total products from Excel file",
                    orderGroups.size(), totalProducts);

            return ExcelExtractionResponse.builder()
                    .orders(new ArrayList<>(orderGroups.values()))
                    .totalOrders(orderGroups.size())
                    .totalProducts(totalProducts)
                    .extractionStatus("SUCCESS")
                    .message("Data extracted successfully - " + orderGroups.size() + " orders with " + totalProducts
                            + " products")
                    .build();

        } catch (BadRequestException e) {
            log.error("Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error extracting data from Excel: {}", e.getMessage(), e);
            throw new BadRequestException("Error extracting data: " + e.getMessage());
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (IOException e) {
                    log.warn("Failed to close workbook", e);
                }
            }
        }
    }

    /**
     * Create order with products
     */
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        if (orderRepository.existsByOrderNo(request.getOrderNo())) {
            throw new BadRequestException("Order number already exists: " + request.getOrderNo());
        }

        Order order = orderMapper.toEntity(request);

        // Manual mapping to ensure persistence if mapper is stale
        if (request.getShipmentNote() != null) {
            order.setShipmentNote(request.getShipmentNote());
        }
        log.info("Creating order with ShipmentNote: '{}'", order.getShipmentNote());

        // Handle customer-specific order
        if (request.getCustomerId() != null) {
            // Use existing customer
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found"));
            order.setCustomer(customer);
        } else if (request.getCustomerData() != null) {
            // Create new customer
            Customer newCustomer = customerMapper.toEntity(request.getCustomerData());
            Customer savedCustomer = customerRepository.save(newCustomer);
            order.setCustomer(savedCustomer);
        }

        // Handle sales consultant assignment
        if (request.getSalesConsultantId() != null) {
            com.stokmate.domain.User salesConsultant = userRepository.findById(request.getSalesConsultantId())
                    .orElseThrow(() -> new NotFoundException("Sales consultant not found"));
            order.setSalesConsultant(salesConsultant);
        }

        // Add products to order
        for (OrderProductCreateRequest productRequest : request.getProducts()) {
            OrderProduct product = orderProductMapper.toEntity(productRequest);
            // DEBUG: Log brand value
            log.info("OrderProduct brand after mapping: {} for product: {}", product.getBrand(),
                    product.getProductName());
            order.addProduct(product);
        }

        Order savedOrder = orderRepository.save(order);

        // Handle SSH order linkage to parent order and shipment
        if (request.getParentOrderId() != null) {
            Order parentOrder = orderRepository.findById(request.getParentOrderId())
                    .orElseThrow(() -> new NotFoundException("Parent order not found"));
            savedOrder.setParentOrder(parentOrder);

            // If linked to a shipment, set the shipment link
            if (request.getLinkedShipmentId() != null) {
                savedOrder.setLinkedShipmentId(request.getLinkedShipmentId());
                savedOrder.setHidden(true); // Hide SSH orders from main list
                savedOrder.setStatus(OrderStatus.PENDING_ACCEPTANCE); // SSH orders need product acceptance

                // Link the shipment to this SSH order
                final Order finalSavedOrder = savedOrder;
                shipmentRepository.findById(request.getLinkedShipmentId()).ifPresent(shipment -> {
                    shipment.setLinkedSshOrder(finalSavedOrder);
                    shipmentRepository.save(shipment);
                });
            }

            // Set hidden if explicitly requested
            if (request.getHidden() != null && request.getHidden()) {
                savedOrder.setHidden(true);
            }

            savedOrder = orderRepository.save(savedOrder);
        }

        // DEBUG: Log brands after saving
        savedOrder.getProducts().forEach(
                p -> log.info("Saved OrderProduct brand: {} for product: {}", p.getBrand(), p.getProductName()));

        // Log activity (wrapped in try-catch to prevent transaction issues)
        try {
            orderActivityService.logActivity(savedOrder, ActivityType.CREATED,
                    savedOrder.getProducts().size() + " ürün ile sipariş oluşturuldu");
        } catch (Exception e) {
            log.error("Activity logging failed for order {}: {}", savedOrder.getOrderNo(), e.getMessage());
        }

        return orderMapper.toResponse(savedOrder);
    }

    /**
     * Get order by ID
     */
    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        OrderResponse response = orderMapper.toResponse(order);

        // Manual mapping for display
        response.setShipmentNote(order.getShipmentNote());

        return response;
    }

    /**
     * List orders, optionally filtered by status.
     * If includeHidden is true, returns all orders (including SSH/hidden).
     * If includeHidden is false, returns only non-hidden orders.
     */
    public List<OrderResponse> listOrdersByStatus(OrderStatus status, boolean includeHidden) {
        List<Order> orders;

        if (includeHidden) {
            // Fetch all orders regardless of hidden status
            if (status == null) {
                orders = orderRepository.findAll();
            } else {
                orders = orderRepository.findByStatus(status);
            }
        } else {
            // Default behavior: Fetch only visible orders
            if (status == null) {
                orders = orderRepository.findByHiddenFalse();
            } else {
                orders = orderRepository.findByStatusAndHiddenFalse(status);
            }
        }

        List<OrderResponse> responses = new ArrayList<>();
        for (Order o : orders) {
            responses.add(orderMapper.toResponse(o));
        }
        return responses;
    }

    /**
     * Mark order as completed
     */
    @Transactional
    public OrderResponse completeOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        order.setStatus(OrderStatus.TAMAMLANDI);
        Order saved = orderRepository.save(order);

        // Log activity
        orderActivityService.logActivity(saved, ActivityType.COMPLETED, "Sipariş tamamlandı olarak işaretlendi");

        // Deallocate stock if it was a sales order
        if (saved.getOrderType() != com.stokmate.domain.OrderType.STOCK) {
            for (OrderProduct op : saved.getProducts()) {
                try {
                    productAllocationService.deallocateStock(op);
                } catch (Exception e) {
                    log.error("Stock deallocation failed for product {}", op.getProductCode(), e);
                    // Non-blocking error for cancellation, but logged
                }
            }
        }

        return orderMapper.toResponse(saved);
    }

    /**
     * Cancel an order - Converts customer order to stock order
     * Cancels pending shipments and adds accepted products to cancelled stock
     */
    @Transactional
    public OrderResponse cancelOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // If order is already completed or cancelled, cannot cancel
        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.TAMAMLANDI ||
                order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.IPTAL_EDILDI) {
            throw new BadRequestException("Cannot cancel completed or already cancelled order");
        }

        boolean wasCustomerSpecific = order.getOrderType() == com.stokmate.domain.OrderType.CUSTOMER_SPECIFIC;

        // Convert customer specific order to stock order (iptal stoğu)
        // IMPORTANT: Status remains IN_PROGRESS so products can still be accepted
        if (wasCustomerSpecific) {
            order.setOrderType(com.stokmate.domain.OrderType.STOCK);
            order.setConvertedFromCustomer(true); // Mark as converted for UI labeling

            // Cancel pending shipments for this order
            cancelPendingShipmentsForOrder(order);

            // Add accepted products to cancelled stock
            addProductsToCancelledStock(order);
        } else {
            // For non-customer orders, set status to cancelled
            order.setStatus(OrderStatus.IPTAL_EDILDI);
        }

        Order saved = orderRepository.save(order);

        // Force flush to catch any DB errors immediately
        orderRepository.flush();

        // Log activity
        try {
            String message = wasCustomerSpecific
                    ? "Müşteri siparişi iptal edildi ve stoklu siparişe dönüştürüldü"
                    : "Sipariş iptal edildi";
            orderActivityService.logActivity(saved, ActivityType.CANCELLED, message);
        } catch (Exception e) {
            log.error("Activity logging failed for order {}: {}", saved.getOrderNo(), e.getMessage());
        }

        return orderMapper.toResponse(saved);
    }

    /**
     * Cancel all pending (not finalized) shipments for an order
     */
    private void cancelPendingShipmentsForOrder(Order order) {
        try {
            List<com.stokmate.domain.Shipment> pendingShipments = shipmentRepository.findByOrderIdAndStatusIn(
                    order.getId(),
                    java.util.Arrays.asList(
                            com.stokmate.domain.ShipmentStatus.PENDING,
                            com.stokmate.domain.ShipmentStatus.APPROVED,
                            com.stokmate.domain.ShipmentStatus.PLANNED));

            for (com.stokmate.domain.Shipment shipment : pendingShipments) {
                // Remove shipment items - they won't be shipped anymore
                shipment.getItems().clear();
                shipmentRepository.delete(shipment);
                log.info("Cancelled pending shipment {} for order {}", shipment.getId(), order.getOrderNo());
            }
        } catch (Exception e) {
            log.error("Failed to cancel pending shipments for order {}: {}", order.getOrderNo(), e.getMessage());
        }
    }

    /**
     * Add accepted products from cancelled order to cancelled stock
     */
    private void addProductsToCancelledStock(Order order) {
        for (OrderProduct op : order.getProducts()) {
            BigDecimal acceptedQty = op.getAcceptedQuantity();
            if (acceptedQty == null || acceptedQty.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            Product product = productRepository.findByCode(op.getProductCode()).orElse(null);
            if (product != null) {
                BigDecimal oldQty = product.getCancelledStockQuantity();
                BigDecimal newQty = oldQty.add(acceptedQty);

                product.setCancelledStockQuantity(newQty);
                productRepository.save(product);

                // Log to stock history
                try {
                    com.stokmate.domain.ProductStockHistory history = new com.stokmate.domain.ProductStockHistory();
                    history.setProduct(product);
                    history.setOldQuantity(oldQty);
                    history.setNewQuantity(newQty);
                    history.setChangeAmount(acceptedQty);
                    history.setReason("Müşteri Siparişi İptali: " + order.getOrderNo());
                    history.setType(com.stokmate.domain.ProductStockHistory.StockChangeType.CANCELLED);
                    history.setUserEmail(com.stokmate.security.SecurityUtils.getCurrentUserLogin());
                    productStockHistoryRepository.save(history);
                } catch (Exception e) {
                    log.error("Stock history logging failed for product {}: {}", op.getProductCode(), e.getMessage());
                }

                log.info("Added {} units of {} to cancelled stock", acceptedQty, op.getProductCode());
            }
        }
    }

    /**
     * Approve cancellation
     */
    @Transactional
    public OrderResponse approveCancellation(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.CANCELLATION_PENDING_APPROVAL) {
            // Allow force cancel capability if needed, but primarily strictly follow flow
            // For now, allow force cancel from any active status if user has role (checked
            // by controller)
            // But to be safe, let's enforce pending status OR allow direct cancel if admin.
            // Let's stick to the requested flow: "cancel -> pending -> approve".
            if (order.getStatus().getSimplifiedStatus() == OrderStatus.CANCELLED) {
                throw new BadRequestException("Order is already cancelled");
            }
        }

        order.setStatus(OrderStatus.IPTAL_EDILDI);
        Order saved = orderRepository.save(order);

        // Handle Stock Logic
        // "müşteri özel siparişler iptal edilir ve ardından onay verilirse stoklu
        // siparişe dönüşür ...
        // ama normal stoğa değil müşteri iptal stoğu gibi birşey olur"

        if (order.getOrderType() != com.stokmate.domain.OrderType.STOCK) {
            // This is a Customer Order (Private/Special) - ürünleri iptal stoğuna ekle
            for (OrderProduct op : order.getProducts()) {
                Product product = productRepository.findByCode(op.getProductCode()).orElse(null);
                if (product != null) {
                    BigDecimal oldQty = product.getCancelledStockQuantity();
                    BigDecimal change = op.getQuantity();
                    BigDecimal newQty = oldQty.add(change);

                    product.setCancelledStockQuantity(newQty);
                    productRepository.save(product);

                    // Log to stock history
                    try {
                        com.stokmate.domain.ProductStockHistory history = new com.stokmate.domain.ProductStockHistory();
                        history.setProduct(product);
                        history.setOldQuantity(oldQty);
                        history.setNewQuantity(newQty);
                        history.setChangeAmount(change);
                        history.setReason("Sipariş İptali: " + order.getOrderNo());
                        history.setType(com.stokmate.domain.ProductStockHistory.StockChangeType.CANCELLED);
                        history.setUserEmail(com.stokmate.security.SecurityUtils.getCurrentUserLogin());
                        productStockHistoryRepository.save(history);
                    } catch (Exception e) {
                        log.error("Stock history logging failed: {}", e.getMessage());
                    }
                }
            }
        }

        // Log activity
        orderActivityService.logActivity(saved, ActivityType.CANCELLED,
                "Sipariş iptali onaylandı, ürünler iptal stoğuna aktarıldı");

        return orderMapper.toResponse(saved);
    }

    /**
     * List orders pending product acceptance
     * Returns orders with status TAMAMLANDI and productsAccepted = false
     * Also includes cancelled stock orders (converted from customer orders) with
     * unaccepted products
     */
    public List<OrderResponse> listPendingAcceptanceOrders() {
        List<Order> orders = orderRepository.findByStatusAndProductsAccepted(
                OrderStatus.TAMAMLANDI, false);

        // Also include cancelled stock orders (converted from customer to stock)
        List<Order> cancelledStockOrders = orderRepository.findByStatusAndProductsAccepted(
                OrderStatus.IPTAL_EDILDI, false);

        // Filter to only include STOCK type orders (these are converted customer
        // orders)
        for (Order o : cancelledStockOrders) {
            if (o.getOrderType() == com.stokmate.domain.OrderType.STOCK && !orders.contains(o)) {
                orders.add(o);
            }
        }

        List<OrderResponse> responses = new ArrayList<>();
        for (Order o : orders) {
            responses.add(orderMapper.toResponse(o));
        }
        return responses;
    }

    /**
     * Accept products for an order
     */
    @Transactional
    public OrderResponse acceptProducts(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Check if order is completed
        if (order.getStatus() != OrderStatus.TAMAMLANDI) {
            throw new BadRequestException("Order must be completed before accepting products");
        }

        order.setProductsAccepted(true);

        // If STOCK order, record product arrivals and update stock
        if (order.getOrderType() == com.stokmate.domain.OrderType.STOCK) {
            for (OrderProduct orderProduct : order.getProducts()) {
                // Find product by code
                Product product = productRepository.findByCode(orderProduct.getProductCode())
                        .orElse(null);

                if (product != null) {
                    // Create ProductArrival record
                    ProductArrival arrival = ProductArrival.builder()
                            .productId(product.getId())
                            .orderId(order.getId())
                            .quantity(orderProduct.getQuantity())
                            .arrivalPrice(orderProduct.getNetPrice() != null ? orderProduct.getNetPrice()
                                    : orderProduct.getGrossPrice())
                            .vatRate(orderProduct.getVat())
                            .receivedBy(order.getCreatedBy() != null ? order.getCreatedBy().toString() : "system")
                            .build();

                    productArrivalRepository.save(arrival);

                    // Update product's current arrival price and stock
                    if (arrival.getArrivalPrice() != null) {
                        product.setArrivalPrice(arrival.getArrivalPrice());
                    }
                    if (arrival.getVatRate() != null) {
                        product.setVatRate(arrival.getVatRate());
                    }
                    product.setStockQuantity(product.getStockQuantity().add(orderProduct.getQuantity()));
                    productRepository.save(product);

                    log.info("Updated existing product {} with quantity {} at price {}",
                            product.getCode(), orderProduct.getQuantity(), arrival.getArrivalPrice());
                } else {
                    // Product doesn't exist - create new product for STOCK orders
                    Product newProduct = new Product();
                    newProduct.setCode(orderProduct.getProductCode());
                    newProduct.setName(orderProduct.getProductName());
                    newProduct.setStockQuantity(orderProduct.getQuantity());
                    newProduct.setArrivalPrice(orderProduct.getNetPrice() != null ? orderProduct.getNetPrice()
                            : orderProduct.getGrossPrice());
                    newProduct.setVatRate(orderProduct.getVat());

                    Product savedProduct = productRepository.save(newProduct);

                    // Create ProductArrival record
                    ProductArrival arrival = ProductArrival.builder()
                            .productId(savedProduct.getId())
                            .orderId(order.getId())
                            .quantity(orderProduct.getQuantity())
                            .arrivalPrice(savedProduct.getArrivalPrice())
                            .vatRate(savedProduct.getVatRate())
                            .receivedBy(order.getCreatedBy() != null ? order.getCreatedBy().toString() : "system")
                            .build();

                    productArrivalRepository.save(arrival);

                    log.info("Created new product {} with quantity {} at price {}",
                            savedProduct.getCode(), orderProduct.getQuantity(), arrival.getArrivalPrice());
                }
            }
        }

        Order saved = orderRepository.save(order);

        // Log activity
        orderActivityService.logActivity(saved, ActivityType.PRODUCTS_ACCEPTED,
                "Products accepted for completed order");

        return orderMapper.toResponse(saved);
    }

    /**
     * Helper method to extract OrderProduct from a single row
     */
    private OrderProductExcelRow extractOrderProductFromRow(Row row, ColumnMapping mapping) {
        try {
            String productCode = getCellValue(row, mapping.productCodeIndex);
            String productName = getCellValue(row, mapping.productNameIndex);

            if (productCode == null || productCode.trim().isEmpty()) {
                return null;
            }

            BigDecimal quantity = parseBigDecimalCell(row, mapping.quantityIndex);
            if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("Invalid or missing quantity for product code: {}", productCode);
                quantity = BigDecimal.ONE;
            }

            BigDecimal vat = parseBigDecimalCell(row, mapping.vatIndex);
            // Convert vat from percentage (e.g., 10) to decimal (0.10)
            if (vat != null && vat.compareTo(BigDecimal.ZERO) > 0) {
                vat = vat.divide(BigDecimal.valueOf(100));
            }

            return OrderProductExcelRow.builder()
                    .productName(productName != null ? productName : productCode)
                    .productCode(productCode)
                    .specName(getCellValue(row, mapping.specNameIndex))
                    .productGroupDefinition(getCellValue(row, mapping.productGroupDefinitionIndex))
                    .warehouseLocation(getCellValue(row, mapping.warehouseLocationIndex))
                    .productionLocationName(getCellValue(row, mapping.productionLocationNameIndex))
                    .grossPrice(parseBigDecimalCell(row, mapping.grossPriceIndex))
                    .netPrice(parseBigDecimalCell(row, mapping.netPriceIndex))
                    .fixedDiscount(parseBigDecimalCell(row, mapping.fixedDiscountIndex))
                    .cashDiscount(parseBigDecimalCell(row, mapping.cashDiscountIndex))
                    .displayDiscount(parseBigDecimalCell(row, mapping.displayDiscountIndex))
                    .discount1(parseBigDecimalCell(row, mapping.discount1Index))
                    .discount2(parseBigDecimalCell(row, mapping.discount2Index))
                    .discount3(parseBigDecimalCell(row, mapping.discount3Index))
                    .discount4(parseBigDecimalCell(row, mapping.discount4Index))
                    .discount5(parseBigDecimalCell(row, mapping.discount5Index))
                    .vat(vat)
                    .paymentCondition(getCellValue(row, mapping.paymentConditionIndex))
                    .paymentConditionDefinition(getCellValue(row, mapping.paymentConditionDefinitionIndex))
                    .quantity(quantity)
                    .build();

        } catch (Exception e) {
            log.warn("Error extracting product from row: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Map Excel column headers to field indices
     */
    private ColumnMapping mapExcelColumns(Row headerRow) {
        ColumnMapping mapping = new ColumnMapping();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            String header = getCellValue(headerRow, i);
            if (header == null)
                continue;

            header = header.trim();

            switch (header) {
                case "SA sprş." -> mapping.orderNoIndex = i;
                case "Prosap Sözleşme No." -> mapping.prosapContractNoIndex = i;
                case "Prosap Sözleşme Ad Soyad" -> mapping.prosapContractNameSurnameIndex = i;
                case "Sipariş Tarihi" -> mapping.orderDateIndex = i;
                case "Malzeme" -> mapping.productCodeIndex = i;
                case "Malzeme kısa metni" -> mapping.productNameIndex = i;
                case "Spec Adı" -> mapping.specNameIndex = i;
                case "Mal grubu tanımı" -> mapping.productGroupDefinitionIndex = i;
                case "Depo Yeri" -> mapping.warehouseLocationIndex = i;
                case "Üretim Yeri Adı" -> mapping.productionLocationNameIndex = i;
                case "Brüt Fiyat" -> mapping.grossPriceIndex = i;
                case "Net Fiyat" -> mapping.netPriceIndex = i;
                case "Sabit İskonto" -> mapping.fixedDiscountIndex = i;
                case "Nakit İskonto" -> mapping.cashDiscountIndex = i;
                case "Teşhir İskonto" -> mapping.displayDiscountIndex = i;
                case "İskonto 1" -> mapping.discount1Index = i;
                case "İskonto 2" -> mapping.discount2Index = i;
                case "İskonto 3" -> mapping.discount3Index = i;
                case "İskonto 4" -> mapping.discount4Index = i;
                case "İskonto 5" -> mapping.discount5Index = i;
                case "KDV(%)" -> mapping.vatIndex = i;
                case "Ödeme Koşulu" -> mapping.paymentConditionIndex = i;
                case "ÖDK Tanımı" -> mapping.paymentConditionDefinitionIndex = i;
                case "Not" -> mapping.noteIndex = i;
                default -> {
                    // Try to match quantity columns
                    if (header.contains("Miktar") || header.contains("Qty") || header.contains("Quantity")) {
                        mapping.quantityIndex = i;
                    }
                }
            }
        }

        if (mapping.orderNoIndex < 0 || mapping.productCodeIndex < 0) {
            throw new BadRequestException("Required columns not found in Excel file");
        }

        return mapping;
    }

    /**
     * Hard delete order (Admin/Manager only)
     * Deletes order and all associated data (shipments, products, activities)
     */
    @Transactional
    public void deleteOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        log.info("Hard deleting order: {}", order.getOrderNo());

        // 1. Delete associated shipments
        List<com.stokmate.domain.Shipment> shipments = shipmentRepository.findByOrderId(orderId);
        if (!shipments.isEmpty()) {
            log.info("Deleting {} shipments associated with order {}", shipments.size(), order.getOrderNo());
            shipmentRepository.deleteAll(shipments);
        }

        // 2. Delete the order (products and activities will be deleted by Cascade if
        // configured,
        // but activities usually don't cascade from OneToMany in Order entity, we might
        // need to handle them if they are not mapped)
        // Order entity: @OneToMany(mappedBy = "order", cascade = CascadeType.ALL...
        // private Set<OrderProduct> products
        // OrderActivity entity usually has @ManyToOne to Order.
        // If DB has ON DELETE CASCADE constraint, it's fine. If not, we might fail.
        // Let's rely on JPA or DB. If it fails, we will know.
        // Safest is to delete order and let DB handle it or JPA.

        // Also handling linked SSH orders if any
        List<Order> sshOrders = orderRepository.findByParentOrderId(orderId);
        if (!sshOrders.isEmpty()) {
            log.info("Deleting {} SSH sub-orders associated with order {}", sshOrders.size(), order.getOrderNo());
            orderRepository.deleteAll(sshOrders);
        }

        // Explicitly delete activities to prevent FK constraint violation
        orderActivityService.deleteActivitiesForOrder(orderId);

        // Explicitly delete order notes
        orderNoteRepository.deleteByOrderId(orderId);

        orderRepository.delete(order);
        log.info("Order deleted successfully");
    }

    /**
     * Full update of order details (Admin/Manager only)
     */
    @Transactional
    public OrderResponse updateOrder(UUID orderId, com.stokmate.dto.order.UpdateOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        boolean somethingChanged = false;

        if (request.getOrderNo() != null && !request.getOrderNo().equals(order.getOrderNo())) {
            // Check uniqueness if changed
            if (orderRepository.existsByOrderNo(request.getOrderNo())) {
                throw new BadRequestException("Order number already exists: " + request.getOrderNo());
            }
            order.setOrderNo(request.getOrderNo());
            somethingChanged = true;
        }

        if (request.getProsapContractNo() != null
                && !request.getProsapContractNo().equals(order.getProsapContractNo())) {
            order.setProsapContractNo(request.getProsapContractNo());
            somethingChanged = true;
        }

        if (request.getProsapContractNameSurname() != null
                && !request.getProsapContractNameSurname().equals(order.getProsapContractNameSurname())) {
            order.setProsapContractNameSurname(request.getProsapContractNameSurname());
            somethingChanged = true;
        }

        if (request.getOrderDate() != null && !request.getOrderDate().equals(order.getOrderDate())) {
            order.setOrderDate(request.getOrderDate());
            somethingChanged = true;
        }

        if (request.getOrderNotes() != null) {
            order.setOrderNotes(request.getOrderNotes());
            somethingChanged = true;
        }

        if (request.getShipmentNote() != null) {
            order.setShipmentNote(request.getShipmentNote());
            somethingChanged = true;
        }

        if (request.getCustomerId() != null
                && (order.getCustomer() == null || !request.getCustomerId().equals(order.getCustomer().getId()))) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found"));
            order.setCustomer(customer);
            somethingChanged = true;
        }

        if (request.getSalesConsultantId() != null) {
            com.stokmate.domain.User salesConsultant = userRepository.findById(request.getSalesConsultantId())
                    .orElseThrow(() -> new NotFoundException("Sales consultant not found"));
            order.setSalesConsultant(salesConsultant);
            somethingChanged = true;
        }

        if (somethingChanged) {
            Order saved = orderRepository.save(order);
            // Log activity
            try {
                orderActivityService.logActivity(saved, ActivityType.ORDER_UPDATED, "Sipariş bilgileri güncellendi");
            } catch (Exception e) {
                // ignore log error
            }
            return orderMapper.toResponse(saved);
        }

        return orderMapper.toResponse(order);
    }

    /**
     * Get cell value as String
     */
    private String getCellValue(Row row, int columnIndex) {
        if (columnIndex < 0 || row == null)
            return null;

        Cell cell = row.getCell(columnIndex);
        if (cell == null)
            return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    /**
     * Parse cell value as BigDecimal
     */
    private BigDecimal parseBigDecimalCell(Row row, int columnIndex) {
        if (columnIndex < 0 || row == null)
            return null;

        Cell cell = row.getCell(columnIndex);
        if (cell == null)
            return null;

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    // Replace comma with dot for decimal separator
                    value = value.replace(",", ".");
                    return new BigDecimal(value);
                }
            }
        } catch (Exception e) {
            log.debug("Error parsing BigDecimal from cell", e);
        }

        return null;
    }

    /**
     * Parse cell value as LocalDate with Turkish format (d.M.yyyy)
     */
    private LocalDate parseDateCell(Row row, int columnIndex) {
        if (columnIndex < 0 || row == null) {
            throw new BadRequestException("Order date column not found");
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            throw new BadRequestException("Order date is required");
        }

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            } else if (cell.getCellType() == CellType.STRING) {
                String dateStr = cell.getStringCellValue().trim();
                return LocalDate.parse(dateStr, EXCEL_DATE_FORMATTER);
            }
        } catch (DateTimeParseException e) {
            log.error("Error parsing date from cell: {}", e.getMessage());
            throw new BadRequestException("Invalid date format. Expected format: gün.ay.yıl (e.g., 15.12.2024)");
        }

        throw new BadRequestException("Invalid date cell type");
    }

    /**
     * Check if row is empty
     */
    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;

        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    /**
     * Detect if file is XLSX format by checking magic bytes (PK signature)
     */
    private boolean isXlsxFormat(byte[] fileContent) {
        if (fileContent.length < 4)
            return false;
        // XLSX files are ZIP archives, magic bytes: 50 4B 03 04 (PK..)
        return fileContent[0] == (byte) 0x50 && fileContent[1] == (byte) 0x4B
                && fileContent[2] == (byte) 0x03 && fileContent[3] == (byte) 0x04;
    }

    /**
     * Detect if file is XLS format by checking magic bytes (OLE2 signature)
     */
    private boolean isXlsFormat(byte[] fileContent) {
        if (fileContent.length < 8)
            return false;
        // XLS files are OLE2 documents, magic bytes: D0 CF 11 E0 A1 B1 1A E1
        return fileContent[0] == (byte) 0xD0 && fileContent[1] == (byte) 0xCF
                && fileContent[2] == (byte) 0x11 && fileContent[3] == (byte) 0xE0
                && fileContent[4] == (byte) 0xA1 && fileContent[5] == (byte) 0xB1
                && fileContent[6] == (byte) 0x1A && fileContent[7] == (byte) 0xE1;
    }

    /**
     * Inner class to hold column indices
     */
    private static class ColumnMapping {
        int orderNoIndex = -1;
        int prosapContractNoIndex = -1;
        int prosapContractNameSurnameIndex = -1;
        int orderDateIndex = -1;
        int productCodeIndex = -1;
        int productNameIndex = -1;
        int specNameIndex = -1;
        int productGroupDefinitionIndex = -1;
        int warehouseLocationIndex = -1;
        int productionLocationNameIndex = -1;
        int grossPriceIndex = -1;
        int netPriceIndex = -1;
        int fixedDiscountIndex = -1;
        int cashDiscountIndex = -1;
        int displayDiscountIndex = -1;
        int discount1Index = -1;
        int discount2Index = -1;
        int discount3Index = -1;
        int discount4Index = -1;
        int discount5Index = -1;
        int vatIndex = -1;
        int paymentConditionIndex = -1;
        int paymentConditionDefinitionIndex = -1;
        int quantityIndex = -1;
        int noteIndex = -1;
    }

    /**
     * Upload invoice for an order
     */
    @Transactional
    public OrderResponse uploadInvoice(UUID orderId, org.springframework.web.multipart.MultipartFile file) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        try {
            // Generate unique file key
            String fileKey = "invoices/order-" + orderId + "/" + file.getOriginalFilename();

            // Upload to MinIO
            storageService.upload(fileKey, file.getBytes(), file.getContentType());

            // Update order
            order.setInvoiceFileKey(fileKey);
            Order saved = orderRepository.save(order);

            log.info("Invoice uploaded for order {} with key {}", order.getOrderNo(), fileKey);
            return orderMapper.toResponse(saved);
        } catch (Exception e) {
            log.error("Failed to upload invoice for order {}", orderId, e);
            throw new BadRequestException("Failed to upload invoice: " + e.getMessage());
        }
    }

    /**
     * Get invoice presigned URL for an order
     */
    public com.stokmate.dto.order.InvoiceUrlResponse getInvoiceUrl(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getInvoiceFileKey() == null) {
            throw new NotFoundException("Order has no invoice");
        }

        // Return raw path for backend proxy (frontend uses /api/files/view)
        String url = order.getInvoiceFileKey();

        // Extract filename from key
        String fileName = order.getInvoiceFileKey().substring(order.getInvoiceFileKey().lastIndexOf("/") + 1);

        return com.stokmate.dto.order.InvoiceUrlResponse.builder()
                .url(url)
                .fileName(fileName)
                .build();
    }

    /**
     * Get orders by customer ID
     */
    public List<OrderResponse> getOrdersByCustomerId(UUID customerId) {
        List<Order> orders = orderRepository.findByCustomerId(customerId);
        List<OrderResponse> responses = new ArrayList<>();
        for (Order o : orders) {
            responses.add(orderMapper.toResponse(o));
        }
        return responses;
    }

    /**
     * Approve shipment for an order
     */
    @Transactional
    public OrderResponse approveShipment(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_SHIPMENT_APPROVAL) {
            throw new BadRequestException("Order is not pending shipment approval");
        }

        order.setStatus(OrderStatus.SHIPMENT_APPROVED);
        Order saved = orderRepository.save(order);

        // Find user who triggered this action?
        // Service methods usually don't know about current user unless passed.
        // OrderActivityService usually takes a user but here we might rely on
        // SecurityContext in Controller or Service.
        // But wait, orderActivityService.logActivity(order, type, description) overload
        // likely uses SecurityContextHolder.

        orderActivityService.logActivity(saved, ActivityType.SHIPMENT_APPROVED, "Sevk onayı verildi");

        return orderMapper.toResponse(saved);
    }

    /**
     * Update partial delivery status for an order
     * Only allowed for CUSTOMER_SPECIFIC orders by sales consultant or admin
     */
    @Transactional
    public OrderResponse updatePartialDelivery(UUID orderId,
            com.stokmate.dto.order.PartialDeliveryUpdateRequest request, com.stokmate.domain.User currentUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Validate order type
        if (order.getOrderType() != com.stokmate.domain.OrderType.CUSTOMER_SPECIFIC) {
            throw new BadRequestException("Partial delivery tracking is only available for customer-specific orders");
        }

        // Check permissions
        if (!canUpdatePartialDelivery(order, currentUser)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You don't have permission to update this order");
        }

        // Update partial delivery fields on ORDER level
        order.setPartialDeliveryMarked(
                request.getPartialDeliveryMarked() != null ? request.getPartialDeliveryMarked() : false);
        order.setDeliveryNotes(request.getNotes());
        order.setDeliveryLastUpdatedBy(currentUser);
        order.setDeliveryLastUpdatedAt(java.time.LocalDateTime.now());

        // Create event
        createOrderEvent(order, "PARTIAL_DELIVERY_UPDATED", currentUser, request);

        Order saved = orderRepository.save(order);

        log.info("Partial delivery updated for order {} by user {}",
                orderId, currentUser.getId());

        return orderMapper.toResponse(saved);
    }

    /**
     * Get order events for tracking
     */
    public List<com.stokmate.dto.order.OrderEventResponse> getOrderEvents(UUID orderId) {
        // Verify order exists
        orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        List<com.stokmate.domain.OrderEvent> events = orderEventRepository.findByOrderIdOrderByCreatedAtDesc(orderId);

        List<com.stokmate.dto.order.OrderEventResponse> responses = new ArrayList<>();
        for (com.stokmate.domain.OrderEvent event : events) {
            responses.add(orderEventMapper.toResponse(event));
        }

        return responses;
    }

    /**
     * Check if user can update partial delivery for an order
     */
    private boolean canUpdatePartialDelivery(Order order, com.stokmate.domain.User user) {
        // Admin and MANAGER can always update
        if (user.getRole() == com.stokmate.domain.Role.ADMIN ||
                user.getRole() == com.stokmate.domain.Role.MANAGER) {
            return true;
        }

        // Sales consultant (STORE_EMPLOYEE) can update their own orders
        if (user.getRole() == com.stokmate.domain.Role.STORE_EMPLOYEE &&
                order.getSalesConsultant() != null &&
                order.getSalesConsultant().getId().equals(user.getId())) {
            return true;
        }

        return false;
    }

    /**
     * Create an order event
     */
    private void createOrderEvent(Order order, String eventType,
            com.stokmate.domain.User user, Object eventData) {
        Map<String, Object> data = new java.util.HashMap<>();

        if (eventData instanceof com.stokmate.dto.order.PartialDeliveryUpdateRequest) {
            com.stokmate.dto.order.PartialDeliveryUpdateRequest request = (com.stokmate.dto.order.PartialDeliveryUpdateRequest) eventData;
            data.put("partialDeliveryMarked", request.getPartialDeliveryMarked());
            data.put("notes", request.getNotes());
        }

        com.stokmate.domain.OrderEvent event = com.stokmate.domain.OrderEvent.builder()
                .order(order)
                .eventType(eventType)
                .eventData(data)
                .createdBy(user)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        orderEventRepository.save(event);
    }

    /**
     * Update sales consultant for an order
     * Only allowed for admin/manager
     */
    @Transactional
    public OrderResponse updateSalesConsultant(UUID orderId, UUID salesConsultantId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // If salesConsultantId is not null, validate the user exists and is a
        // consultant
        com.stokmate.domain.User salesConsultant = null;
        if (salesConsultantId != null) {
            salesConsultant = userRepository.findById(salesConsultantId)
                    .orElseThrow(() -> new NotFoundException("Sales consultant not found"));

            // Verify the user is actually a sales consultant (STORE_EMPLOYEE role)
            if (salesConsultant.getRole() != com.stokmate.domain.Role.STORE_EMPLOYEE) {
                throw new BadRequestException("Selected user is not a sales consultant");
            }
        }

        // Update sales consultant (can be null to remove assignment)
        order.setSalesConsultant(salesConsultant);
        Order saved = orderRepository.save(order);

        // Log activity
        String activityMessage = salesConsultant != null
                ? "Satış danışmanı atandı: " + salesConsultant.getFirstName() + " " + salesConsultant.getLastName()
                : "Satış danışmanı ataması kaldırıldı";
        orderActivityService.logActivity(saved, ActivityType.ORDER_UPDATED, activityMessage);

        log.info("Sales consultant updated for order {} - consultant: {}",
                orderId, salesConsultant != null ? salesConsultant.getId() : "removed");

        return orderMapper.toResponse(saved);
    }

    @Transactional
    public OrderResponse updateBrand(UUID orderId, Brand brand) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Update brand for all products in the order
        order.getProducts().forEach(product -> {
            product.setBrand(brand);
            log.info("Updated brand to {} for product: {}", brand, product.getProductName());
        });

        Order savedOrder = orderRepository.save(order);

        // Log activity
        orderActivityService.logActivity(savedOrder, ActivityType.ORDER_UPDATED,
                "Sipariş markası güncellendi: " + brand);

        return orderMapper.toResponse(savedOrder);
    }

    /**
     * Check if all products in the order are fully shipped and mark order as
     * COMPLETED
     * Called after shipment completion/approval
     */
    @Transactional
    public void checkAndCompleteOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Skip if already completed or cancelled
        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            log.info("Order {} already in final state: {}", orderId, order.getStatus());
            return;
        }

        // Fetch products fresh from repository to bypass Hibernate cache
        List<OrderProduct> products = orderProductRepository.findByOrderId(orderId);

        // Check if all products are fully shipped
        boolean allShipped = products.stream()
                .allMatch(product -> {
                    BigDecimal quantity = product.getQuantity() != null ? product.getQuantity() : BigDecimal.ZERO;
                    BigDecimal shipped = product.getShippedQuantity() != null ? product.getShippedQuantity()
                            : BigDecimal.ZERO;
                    log.debug("Product {} - quantity: {}, shipped: {}", product.getProductName(), quantity, shipped);
                    return shipped.compareTo(quantity) >= 0;
                });

        log.info("Order {} allShipped check: {}", orderId, allShipped);

        if (allShipped) {
            order.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);

            orderActivityService.logActivity(order, ActivityType.ORDER_UPDATED,
                    "Sipariş tamamlandı - Tüm ürünler sevk edildi");

            log.info("Order {} marked as COMPLETED - all products shipped", orderId);
        } else {
            // Ensure order is IN_PROGRESS if not completed
            if (order.getStatus() != OrderStatus.IN_PROGRESS &&
                    order.getStatus() != OrderStatus.PENDING_SHIPMENT_APPROVAL &&
                    order.getStatus() != OrderStatus.SHIPMENT_APPROVED) {
                order.setStatus(OrderStatus.IN_PROGRESS);
                orderRepository.save(order);
            }
        }
    }

    /**
     * Update product shipped quantity and check for order completion
     */
    @Transactional
    public void updateProductShippedQuantity(UUID orderProductId, BigDecimal shippedQuantity) {
        // Find order product
        Order order = orderRepository.findAll().stream()
                .filter(o -> o.getProducts().stream().anyMatch(p -> p.getId().equals(orderProductId)))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order product not found"));

        OrderProduct product = order.getProducts().stream()
                .filter(p -> p.getId().equals(orderProductId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order product not found"));

        BigDecimal currentShipped = product.getShippedQuantity() != null ? product.getShippedQuantity()
                : BigDecimal.ZERO;
        product.setShippedQuantity(currentShipped.add(shippedQuantity));

        orderRepository.save(order);

        // Check if order should be completed
        checkAndCompleteOrder(order.getId());
    }
}
