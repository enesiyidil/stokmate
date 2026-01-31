package com.stokmate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stokmate.domain.*;
import com.stokmate.dto.cart.*;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private ShoppingCartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    private CartService cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartService(
                cartRepository,
                productRepository,
                customerRepository,
                orderRepository,
                userRepository,
                storageService);
    }

    // ========== Helper Methods ==========

    private User createUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }

    private Product createProduct() {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setCode("PROD001");
        product.setName("Test Product");
        product.setActiveForSale(true);
        product.setStockQuantity(BigDecimal.TEN);
        product.setVatRate(BigDecimal.valueOf(18));
        return product;
    }

    private ShoppingCart createCart(User user) {
        ShoppingCart cart = new ShoppingCart();
        cart.setId(UUID.randomUUID());
        cart.setCreator(user);
        cart.setStatus(CartStatus.ACTIVE);
        cart.setCreatedDate(LocalDateTime.now());
        cart.setItems(new ArrayList<>());
        return cart;
    }

    private Customer createCustomer() {
        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setEmail("john@example.com");
        customer.setPhone("1234567890");
        return customer;
    }

    private CartItemRequest createCartItemRequest(UUID productId) {
        return CartItemRequest.builder()
                .productId(productId)
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(100))
                .vatRate(BigDecimal.valueOf(18))
                .build();
    }

    // ========== GetOrCreateCart Tests ==========

    @Nested
    @DisplayName("getOrCreateCart() Tests")
    class GetOrCreateCartTests {

        @Test
        @DisplayName("Should return existing active cart")
        void getOrCreateCart_ShouldReturnExistingCart() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            ShoppingCart existingCart = createCart(user);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(cartRepository.findByCreatorIdAndStatus(userId, CartStatus.ACTIVE))
                    .thenReturn(Optional.of(existingCart));

            // Act
            CartResponse result = cartService.getOrCreateCart(userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(existingCart.getId());
            verify(cartRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should create new cart when none exists")
        void getOrCreateCart_ShouldCreateNewCart_WhenNoneExists() {
            // Arrange
            UUID userId = UUID.randomUUID();
            User user = createUser();
            user.setId(userId);
            ShoppingCart newCart = createCart(user);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(cartRepository.findByCreatorIdAndStatus(userId, CartStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(cartRepository.save(any(ShoppingCart.class))).thenReturn(newCart);

            // Act
            CartResponse result = cartService.getOrCreateCart(userId);

            // Assert
            assertThat(result).isNotNull();
            verify(cartRepository).save(any(ShoppingCart.class));
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void getOrCreateCart_ShouldThrowException_WhenUserNotFound() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> cartService.getOrCreateCart(userId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ========== AddToCart Tests ==========

    @Nested
    @DisplayName("addToCart() Tests")
    class AddToCartTests {

        @Test
        @DisplayName("Should add product to cart")
        void addToCart_ShouldAddProduct() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);
            cart.setId(cartId);
            Product product = createProduct();

            CartItemRequest request = createCartItemRequest(product.getId());

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
            when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

            // Act
            CartItemResponse result = cartService.addToCart(cartId, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(cart.getItems()).hasSize(1);
            verify(cartRepository).save(cart);
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void addToCart_ShouldThrowException_WhenCartNotFound() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            CartItemRequest request = createCartItemRequest(UUID.randomUUID());

            when(cartRepository.findById(cartId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> cartService.addToCart(cartId, request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Cart not found");
        }

        @Test
        @DisplayName("Should throw exception when product not found")
        void addToCart_ShouldThrowException_WhenProductNotFound() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            UUID productId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);

            CartItemRequest request = createCartItemRequest(productId);

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> cartService.addToCart(cartId, request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Product not found");
        }

        @Test
        @DisplayName("Should throw exception when product not active for sale")
        void addToCart_ShouldThrowException_WhenProductNotActive() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);
            Product product = createProduct();
            product.setActiveForSale(false);

            CartItemRequest request = createCartItemRequest(product.getId());

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
            when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

            // Act & Assert
            assertThatThrownBy(() -> cartService.addToCart(cartId, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not active for sale");
        }

        @Test
        @DisplayName("Should calculate total amount with VAT")
        void addToCart_ShouldCalculateTotalWithVat() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);
            cart.setId(cartId);
            Product product = createProduct();

            CartItemRequest request = CartItemRequest.builder()
                    .productId(product.getId())
                    .quantity(2)
                    .unitPrice(BigDecimal.valueOf(100)) // 100 * 2 = 200
                    .vatRate(BigDecimal.valueOf(10)) // 10% VAT = 20
                    .build();

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
            when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

            // Act
            CartItemResponse result = cartService.addToCart(cartId, request);

            // Assert
            // Total = 200 * 1.10 = 220
            assertThat(result.getTotalAmount()).isEqualByComparingTo("220");
        }
    }

    // ========== RemoveFromCart Tests ==========

    @Nested
    @DisplayName("removeFromCart() Tests")
    class RemoveFromCartTests {

        @Test
        @DisplayName("Should remove item from cart")
        void removeFromCart_ShouldRemoveItem() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            UUID itemId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);

            CartItem item = new CartItem();
            item.setId(itemId);
            cart.getItems().add(item);

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));

            // Act
            cartService.removeFromCart(cartId, itemId);

            // Assert
            assertThat(cart.getItems()).isEmpty();
            verify(cartRepository).save(cart);
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void removeFromCart_ShouldThrowException_WhenCartNotFound() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            UUID itemId = UUID.randomUUID();

            when(cartRepository.findById(cartId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> cartService.removeFromCart(cartId, itemId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== GetCart Tests ==========

    @Nested
    @DisplayName("getCart() Tests")
    class GetCartTests {

        @Test
        @DisplayName("Should return cart")
        void getCart_ShouldReturnCart() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);
            cart.setId(cartId);

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));

            // Act
            CartResponse result = cartService.getCart(cartId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(cartId);
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void getCart_ShouldThrowException_WhenNotFound() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            when(cartRepository.findById(cartId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> cartService.getCart(cartId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ========== ConvertCartToOrder Tests ==========

    @Nested
    @DisplayName("convertCartToOrder() Tests")
    class ConvertCartToOrderTests {

        @Test
        @DisplayName("Should convert cart to order with existing customer")
        void convertCartToOrder_ShouldConvertWithExistingCustomer() throws Exception {
            // Arrange
            UUID cartId = UUID.randomUUID();
            UUID customerId = UUID.randomUUID();
            User user = createUser();
            Customer customer = createCustomer();
            customer.setId(customerId);
            ShoppingCart cart = createCart(user);
            cart.setId(cartId);

            // Add an item to cart
            Product product = createProduct();
            CartItem item = new CartItem();
            item.setId(UUID.randomUUID());
            item.setProduct(product);
            item.setQuantity(2);
            item.setUnitPrice(BigDecimal.valueOf(100));
            item.setVatRate(BigDecimal.valueOf(18));
            item.setTotalAmount(BigDecimal.valueOf(236));
            cart.getItems().add(item);

            CartToOrderRequest request = CartToOrderRequest.builder()
                    .cartId(cartId)
                    .customerId(customerId)
                    .build();

            Order savedOrder = new Order();
            savedOrder.setId(UUID.randomUUID());

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
            when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
            when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

            // Act
            UUID result = cartService.convertCartToOrder(request);

            // Assert
            assertThat(result).isEqualTo(savedOrder.getId());
            assertThat(cart.getStatus()).isEqualTo(CartStatus.CONVERTED_TO_ORDER);
            verify(cartRepository).save(cart);
        }

        @Test
        @DisplayName("Should throw exception when cart is empty")
        void convertCartToOrder_ShouldThrowException_WhenCartEmpty() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);
            cart.setId(cartId);
            cart.setItems(new ArrayList<>()); // Empty

            CartToOrderRequest request = CartToOrderRequest.builder()
                    .cartId(cartId)
                    .build();

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));

            // Act & Assert
            assertThatThrownBy(() -> cartService.convertCartToOrder(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cart is empty");
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void convertCartToOrder_ShouldThrowException_WhenCartNotFound() {
            // Arrange
            UUID cartId = UUID.randomUUID();
            CartToOrderRequest request = CartToOrderRequest.builder()
                    .cartId(cartId)
                    .build();

            when(cartRepository.findById(cartId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> cartService.convertCartToOrder(request))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("Should create new customer when not provided")
        void convertCartToOrder_ShouldCreateNewCustomer_WhenNotProvided() throws Exception {
            // Arrange
            UUID cartId = UUID.randomUUID();
            User user = createUser();
            ShoppingCart cart = createCart(user);
            cart.setId(cartId);

            Product product = createProduct();
            CartItem item = new CartItem();
            item.setId(UUID.randomUUID());
            item.setProduct(product);
            item.setQuantity(1);
            item.setUnitPrice(BigDecimal.valueOf(100));
            item.setVatRate(BigDecimal.valueOf(18));
            item.setTotalAmount(BigDecimal.valueOf(118));
            cart.getItems().add(item);

            CartToOrderRequest request = CartToOrderRequest.builder()
                    .cartId(cartId)
                    .customerId(null)
                    .customerName("New Customer")
                    .customerEmail("new@example.com")
                    .customerPhone("1234567890")
                    .build();

            Customer newCustomer = createCustomer();
            Order savedOrder = new Order();
            savedOrder.setId(UUID.randomUUID());

            when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
            when(customerRepository.save(any(Customer.class))).thenReturn(newCustomer);
            when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

            // Act
            cartService.convertCartToOrder(request);

            // Assert
            verify(customerRepository).save(any(Customer.class));
        }
    }
}
