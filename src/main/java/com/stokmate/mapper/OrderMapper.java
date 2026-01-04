package com.stokmate.mapper;

import com.stokmate.domain.Order;
import com.stokmate.domain.OrderProduct;
import com.stokmate.dto.order.OrderCreateRequest;
import com.stokmate.dto.order.OrderResponse;
import com.stokmate.dto.order.OrderProductResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = { CustomerMapper.class, UserMapper.class })
public abstract class OrderMapper {

    @org.springframework.beans.factory.annotation.Autowired
    protected com.stokmate.service.UserService userService;

    @Mapping(target = "hasInvoice", expression = "java(order.getInvoiceFileKey() != null)")
    @Mapping(target = "salesConsultant", expression = "java(mapSalesConsultant(order))")
    public abstract OrderResponse toResponse(Order order);

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

    @Mapping(target = "acceptedQuantity", source = "acceptedQuantity")
    @Mapping(target = "remainingQuantity", expression = "java(orderProduct.getRemainingQuantity())")
    public abstract OrderProductResponse toProductResponse(OrderProduct orderProduct);

    @AfterMapping
    public void setDefaultAcceptedQuantity(@MappingTarget OrderProductResponse target) {
        if (target.getAcceptedQuantity() == null) {
            target.setAcceptedQuantity(java.math.BigDecimal.ZERO);
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
    public abstract Order toEntity(OrderCreateRequest request);
}
