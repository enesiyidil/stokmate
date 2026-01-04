package com.stokmate.service;

import com.stokmate.domain.*;
import com.stokmate.dto.cart.*;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final ShoppingCartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Transactional
    public CartResponse getOrCreateCart(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        ShoppingCart cart = cartRepository.findByCreatorIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    ShoppingCart newCart = new ShoppingCart();
                    newCart.setCreator(user);
                    newCart.setStatus(CartStatus.ACTIVE);
                    newCart.setCreatedDate(LocalDateTime.now());
                    return cartRepository.save(newCart);
                });

        return toCartResponse(cart);
    }

    @Transactional
    public CartItemResponse addToCart(UUID cartId, CartItemRequest request) {
        ShoppingCart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        if (!product.isActiveForSale()) {
            throw new BadRequestException("Product is not active for sale");
        }

        // Calculate total
        BigDecimal totalAmount = request.getUnitPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()))
                .multiply(BigDecimal.ONE.add(request.getVatRate().divide(BigDecimal.valueOf(100))));

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantity(request.getQuantity());
        item.setUnitPrice(request.getUnitPrice());
        item.setVatRate(request.getVatRate());
        item.setTotalAmount(totalAmount);
        item.setInternetSalesPrice(request.getInternetSalesPrice());

        cart.getItems().add(item);
        cartRepository.save(cart);

        return toCartItemResponse(item);
    }

    @Transactional
    public void removeFromCart(UUID cartId, UUID itemId) {
        ShoppingCart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        cartRepository.save(cart);
    }

    @Transactional
    public CartResponse getCart(UUID cartId) {
        ShoppingCart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException("Cart not found"));
        return toCartResponse(cart);
    }

    @Transactional
    public UUID convertCartToOrder(CartToOrderRequest request) throws Exception {
        ShoppingCart cart = cartRepository.findById(request.getCartId())
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        // Handle customer
        Customer customer;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found"));
        } else {
            customer = new Customer();
            String[] nameParts = request.getCustomerName().split(" ", 2);
            customer.setFirstName(nameParts.length > 0 ? nameParts[0] : "");
            customer.setLastName(nameParts.length > 1 ? nameParts[1] : "");
            customer.setEmail(request.getCustomerEmail());
            customer.setPhone(request.getCustomerPhone());
            customer = customerRepository.save(customer);
        }

        // Upload contract
        String contractPath = null;
        if (request.getContractFile() != null) {
            contractPath = storageService.store(request.getContractFile(), "contracts");
        }

        // Create order from cart
        String customerName = customer.getFirstName() + " " + customer.getLastName();
        Order order = Order.builder()
                .orderNo("SALE-" + System.currentTimeMillis())
                .prosapContractNo(customerName + "-" + System.currentTimeMillis())
                .prosapContractNameSurname(customerName)
                .orderDate(java.time.LocalDate.now())
                .orderType(OrderType.CUSTOMER_SPECIFIC)
                .customer(customer)
                .invoiceFileKey(contractPath)
                .orderNotes(request.getNotes())
                .partialShipmentEnabled(request.isPartialShipmentEnabled())
                .status(OrderStatus.PENDING_ACCEPTANCE)
                .build();

        // Convert cart items to order products
        cart.getItems().forEach(cartItem -> {
            OrderProduct orderProduct = new OrderProduct();
            orderProduct.setOrder(order);
            orderProduct.setProductCode(cartItem.getProduct().getCode());
            orderProduct.setProductName(cartItem.getProduct().getName());
            orderProduct.setQuantity(new BigDecimal(cartItem.getQuantity()));
            orderProduct.setGrossPrice(cartItem.getTotalAmount());
            order.getProducts().add(orderProduct);
        });

        Order saved = orderRepository.save(order);

        // Mark cart as converted
        cart.setStatus(CartStatus.CONVERTED_TO_ORDER);
        cartRepository.save(cart);

        return saved.getId();
    }

    private CartResponse toCartResponse(ShoppingCart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::toCartItemResponse)
                .collect(Collectors.toList());

        BigDecimal total = items.stream()
                .map(CartItemResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .creatorId(cart.getCreator().getId())
                .creatorName(cart.getCreator().getFirstName() + " " + cart.getCreator().getLastName())
                .items(items)
                .totalAmount(total)
                .createdDate(cart.getCreatedDate())
                .status(cart.getStatus())
                .build();
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productCode(item.getProduct().getCode())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .vatRate(item.getVatRate())
                .totalAmount(item.getTotalAmount())
                .internetSalesPrice(item.getInternetSalesPrice())
                .build();
    }
}
