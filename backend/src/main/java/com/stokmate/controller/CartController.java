package com.stokmate.controller;

import com.stokmate.dto.cart.*;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<CartResponse> getCurrentCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        CartResponse response = cartService.getOrCreateCart(userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{cartId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<CartResponse> getCart(@PathVariable UUID cartId) {
        CartResponse response = cartService.getCart(cartId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{cartId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<CartItemResponse> addToCart(
            @PathVariable UUID cartId,
            @RequestBody CartItemRequest request) {
        CartItemResponse response = cartService.addToCart(cartId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{cartId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<Void> removeFromCart(
            @PathVariable UUID cartId,
            @PathVariable UUID itemId) {
        cartService.removeFromCart(cartId, itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{cartId}/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<UUID> checkout(
            @PathVariable UUID cartId,
            @ModelAttribute CartToOrderRequest request) throws Exception {
        request.setCartId(cartId);
        UUID orderId = cartService.convertCartToOrder(request);
        return ResponseEntity.ok(orderId);
    }
}
