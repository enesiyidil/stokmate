package com.stokmate.controller;

import com.stokmate.dto.user.CreateUserRequest;
import com.stokmate.dto.user.Toggle2FARequest;
import com.stokmate.dto.user.UpdateProfileRequest;
import com.stokmate.dto.user.UserProfileResponse;
import com.stokmate.dto.user.UserProfileUpdateRequest;
import com.stokmate.dto.user.UserResponse;
import com.stokmate.dto.user.UserSummaryResponse;
import com.stokmate.security.UserPrincipal;
import com.stokmate.service.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    // Profile endpoints - all authenticated users
    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        // Fetch fresh user data from DB to ensure latest status (e.g. 2FA enabled)
        com.stokmate.domain.User user = userService.getUserById(principal.getUser().getId());
        return userService.getProfile(user);
    }

    @PutMapping("/me")
    public UserProfileResponse updateMe(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        return userService.updateProfile(principal.getUser(), request);
    }

    // Admin user management endpoints - MANAGER and ADMIN only
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER', 'STORE_MANAGER', 'STORE_EMPLOYEE')")
    public ResponseEntity<List<UserSummaryResponse>> getUserSummaries() {
        return ResponseEntity.ok(userService.getUserSummaries());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfileWithPassword(principal.getUser(), request);
        return ResponseEntity.ok(updated);
    }

    // Delete: MANAGER and ADMIN only (DIRECTOR cannot delete users)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // New user management endpoints

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable("id") UUID id,
            @Valid @RequestBody com.stokmate.dto.user.UpdateUserRoleRequest request) {
        UserResponse updated = userService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<UserResponse> toggleUserActive(
            @PathVariable("id") UUID id,
            @Valid @RequestBody com.stokmate.dto.user.ToggleUserActiveRequest request) {
        UserResponse updated = userService.toggleUserActive(id, request.getActive());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/toggle-2fa")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR')")
    public ResponseEntity<UserResponse> toggle2FA(
            @PathVariable("id") UUID id,
            @Valid @RequestBody Toggle2FARequest request) {
        UserResponse updated = userService.toggle2FA(id, request.getEnabled());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/soft")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> softDeleteUser(
            @PathVariable("id") UUID id,
            @Valid @RequestBody com.stokmate.dto.user.DeleteUserWithAliasRequest request) {
        userService.softDeleteUser(id, request.getAlias());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sales-consultants")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE', 'OPERATIONS_MANAGER')")
    public ResponseEntity<List<com.stokmate.dto.user.SalesConsultantResponse>> getSalesConsultants(
            @RequestParam(name = "location", required = false) String location,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "search", required = false) String search) {
        return ResponseEntity.ok(userService.getSalesConsultants(location, department, search));
    }
}
