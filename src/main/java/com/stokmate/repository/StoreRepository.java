package com.stokmate.repository;

import com.stokmate.domain.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, String> {
    Optional<Store> findByCode(String code);

    List<Store> findByActive(boolean active);

    List<Store> findByManagerId(UUID managerId);
}
