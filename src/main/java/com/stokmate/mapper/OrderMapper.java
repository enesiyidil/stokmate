package com.stokmate.mapper;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderProduct;
import com.stokmate.domain.Shipment;
import com.stokmate.domain.ShipmentStatus;
import com.stokmate.dto.order.OrderCreateRequest;
import com.stokmate.dto.order.OrderResponse;
import com.stokmate.dto.order.OrderProductResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Context;

import java.math.BigDecimal;
import java.util.*;

@Mapper(componentModel = "spring", uses = { CustomerMapper.class, UserMapper.class })
public abstract class OrderMapper {

    @org.springframework.beans.factory.annotation.Autowired
    protected com.stokmate.service.UserService userService;

    @org.springframework.beans.factory.annotation.Autowired
    protected com.stokmate.repository.ShipmentRepository shipmentRepository;

    @Mapping(target = "hasInvoice", expression = "java(order.getInvoiceFileKey() != null)")
    @Mapping(target = "salesConsultant", expression = "java(mapSalesConsultant(order))")
    @Mapping(target = "brand", expression = "java(getBrandFromFirstProduct(order))")
    @Mapping(target = "products", expression = "java(mapProductsWithPendingQuantities(order))")
    @Mapping(target = "parentOrderId", expression = "java(order.getParentOrder() != null ? order.getParentOrder().getId() : null)")
    @Mapping(target = "childSshOrders", expression = "java(mapChildSshOrders(order))")
    @Mapping(target = "problemShipments", expression = "java(mapProblemShipments(order))")
    public abstract OrderResponse toResponse(Order order);

    /**
     * Map products with pending shipment quantities calculated
     */
    public java.util.List<OrderProductResponse> mapProductsWithPendingQuantities(Order order) {
        if (order.getProducts() == null || order.getProducts().isEmpty()) {
            return new ArrayList<>();
        }

        // Get pending shipments for this order
        Map<UUID, BigDecimal> pendingQuantities = calculatePendingQuantities(order.getId());

        java.util.List<OrderProductResponse> responses = new ArrayList<>();
        for (OrderProduct product : order.getProducts()) {
            OrderProductResponse response = toProductResponseBasic(product);

            // Add pending quantity from map
            BigDecimal pendingQty = pendingQuantities.getOrDefault(product.getId(), BigDecimal.ZERO);
            response.setPendingShipmentQuantity(pendingQty);

            // Calculate available for shipment (accepted - shipped - pending)
            BigDecimal accepted = product.getAcceptedQuantity() != null ? product.getAcceptedQuantity()
                    : BigDecimal.ZERO;
            BigDecimal shipped = product.getShippedQuantity() != null ? product.getShippedQuantity() : BigDecimal.ZERO;
            BigDecimal available = accepted.subtract(shipped).subtract(pendingQty);
            response.setAvailableForShipmentQuantity(available.max(BigDecimal.ZERO));

            responses.add(response);
        }
        return responses;
    }

    /**
     * Calculate pending shipment quantities for all products in an order
     */
    private Map<UUID, BigDecimal> calculatePendingQuantities(UUID orderId) {
        Map<UUID, BigDecimal> pendingMap = new HashMap<>();

        try {
            // Get shipments that are pending completion (not yet approved)
            List<Shipment> pendingShipments = shipmentRepository.findByOrderIdAndStatusIn(
                    orderId,
                    Arrays.asList(ShipmentStatus.PENDING, ShipmentStatus.APPROVED, ShipmentStatus.PLANNED,
                            ShipmentStatus.COMPLETED));

            for (Shipment shipment : pendingShipments) {
                if (shipment.getItems() != null) {
                    for (var item : shipment.getItems()) {
                        if (item.getOrderProduct() != null) {
                            UUID productId = item.getOrderProduct().getId();
                            BigDecimal qty = BigDecimal.valueOf(item.getShippedQuantity());
                            pendingMap.merge(productId, qty, BigDecimal::add);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // If calculation fails, return empty map
        }

        return pendingMap;
    }

    /**
     * Safely map sales consultant, handling lazy loading
     */
    public com.stokmate.dto.user.UserResponse mapSalesConsultant(Order order) {
        try {
            if (order.getSalesConsultant() != null) {
                com.stokmate.domain.User user = order.getSalesConsultant();
                // Access a field to trigger initialization check
                user.getId();

                // Map to UserResponse
                return com.stokmate.dto.user.UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phone(user.getPhone())
                        .role(user.getRole())
                        .deleted(user.isDeleted())
                        .deletedAlias(user.getDeletedAlias())
                        .displayName(userService.getUserDisplayName(user))
                        .build();
            }
        } catch (org.hibernate.LazyInitializationException e) {
            // If lazy loading fails, return null
            return null;
        }
        return null;
    }

    /**
     * Get brand from first product in order
     */
    public com.stokmate.domain.Brand getBrandFromFirstProduct(Order order) {
        if (order.getProducts() != null && !order.getProducts().isEmpty()) {
            return order.getProducts().stream()
                    .findFirst()
                    .map(com.stokmate.domain.OrderProduct::getBrand)
                    .orElse(null);
        }
        return null;
    }

    @org.springframework.beans.factory.annotation.Autowired
    protected com.stokmate.repository.OrderRepository orderRepository;

    /**
     * Map child SSH orders created from problematic shipments of this order
     */
    public java.util.List<OrderResponse.SshOrderSummary> mapChildSshOrders(Order order) {
        try {
            if (order.getId() == null)
                return new ArrayList<>();

            List<Order> childOrders = orderRepository.findByParentOrderId(order.getId());
            if (childOrders == null || childOrders.isEmpty())
                return new ArrayList<>();

            return childOrders.stream()
                    .filter(child -> child.getLinkedShipmentId() != null)
                    .map(child -> {
                        // Find the problem type from linked shipment
                        String problemType = null;
                        try {
                            var shipment = shipmentRepository.findById(child.getLinkedShipmentId());
                            if (shipment.isPresent() && shipment.get().getProblemType() != null) {
                                problemType = shipment.get().getProblemType().name();
                            }
                        } catch (Exception e) {
                            // Ignore
                        }

                        return OrderResponse.SshOrderSummary.builder()
                                .id(child.getId())
                                .orderNo(child.getOrderNo())
                                .linkedShipmentId(child.getLinkedShipmentId())
                                .problemType(problemType)
                                .orderDate(child.getOrderDate())
                                .build();
                    })
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Map problematic shipments for this order (showing which have SSH orders)
     */
    public java.util.List<OrderResponse.ProblemShipmentSummary> mapProblemShipments(Order order) {
        try {
            if (order.getId() == null) {
                return new ArrayList<>();
            }

            List<com.stokmate.dto.shipment.ProblemShipmentDTO> problemShipments = shipmentRepository
                    .findProblemShipmentsByOrderId(order.getId());

            if (problemShipments == null || problemShipments.isEmpty())
                return new ArrayList<>();

            return problemShipments.stream()
                    .map(dto -> {
                        boolean hasSsh = dto.getLinkedSshOrderId() != null;
                        return OrderResponse.ProblemShipmentSummary.builder()
                                .shipmentId(dto.getShipmentId())
                                .problemType(dto.getProblemType() != null ? dto.getProblemType().name() : null)
                                .completedAt(dto.getActualShipmentDate())
                                .hasSshOrder(hasSsh)
                                .sshOrderId(hasSsh ? dto.getLinkedSshOrderId() : null)
                                .build();
                    })
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            System.out.println("[ERROR] mapProblemShipments: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Mapping(target = "acceptedQuantity", source = "acceptedQuantity")
    @Mapping(target = "shippedQuantity", source = "shippedQuantity")
    @Mapping(target = "remainingQuantity", expression = "java(orderProduct.getRemainingQuantity())")
    @Mapping(target = "pendingShipmentQuantity", ignore = true)
    @Mapping(target = "availableForShipmentQuantity", ignore = true)
    public abstract OrderProductResponse toProductResponseBasic(OrderProduct orderProduct);

    @AfterMapping
    public void setDefaultQuantities(@MappingTarget OrderProductResponse target) {
        if (target.getAcceptedQuantity() == null) {
            target.setAcceptedQuantity(java.math.BigDecimal.ZERO);
        }
        if (target.getShippedQuantity() == null) {
            target.setShippedQuantity(java.math.BigDecimal.ZERO);
        }
        if (target.getPendingShipmentQuantity() == null) {
            target.setPendingShipmentQuantity(java.math.BigDecimal.ZERO);
        }
        if (target.getAvailableForShipmentQuantity() == null) {
            target.setAvailableForShipmentQuantity(java.math.BigDecimal.ZERO);
        }
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "invoiceFileKey", ignore = true)
    @Mapping(target = "productsAccepted", ignore = true)
    @Mapping(target = "products", ignore = true) // Products will be added manually via addProduct()
    @Mapping(target = "customer", ignore = true) // Customer will be set manually in service
    @Mapping(target = "salesConsultant", ignore = true) // Sales consultant will be set manually
    @Mapping(target = "partialDeliveryMarked", ignore = true)
    @Mapping(target = "deliveryNotes", ignore = true)
    @Mapping(target = "deliveryLastUpdatedBy", ignore = true)
    @Mapping(target = "deliveryLastUpdatedAt", ignore = true)
    @Mapping(target = "parentOrder", ignore = true)
    @Mapping(target = "hidden", ignore = true)
    @Mapping(target = "linkedShipmentId", ignore = true)
    public abstract Order toEntity(OrderCreateRequest request);
}
