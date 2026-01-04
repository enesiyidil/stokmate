package com.stokmate.repository;

import com.stokmate.domain.ShoppingCart;
import com.stokmate.domain.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, UUID> {

    Optional<ShoppingCart> findByCreatorIdAndStatus(UUID creatorId, CartStatus status);

    List<ShoppingCart> findByCreatorId(UUID creatorId);
}
