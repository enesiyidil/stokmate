package com.stokmate.repository;

import com.stokmate.domain.StoreEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreEmployeeRepository extends JpaRepository<StoreEmployee, String> {

    @Query("SELECT se FROM StoreEmployee se JOIN FETCH se.user WHERE se.store.id = :storeId AND se.active = :active ORDER BY se.joinDate DESC")
    List<StoreEmployee> findByStoreIdAndActiveOrderByJoinDateDesc(@Param("storeId") String storeId,
            @Param("active") boolean active);

    @Query("SELECT se FROM StoreEmployee se JOIN FETCH se.user WHERE se.user.id = :userId AND se.active = :active")
    Optional<StoreEmployee> findByUserIdAndActive(@Param("userId") UUID userId, @Param("active") boolean active);

    @Query("SELECT se FROM StoreEmployee se JOIN FETCH se.user WHERE se.store.id = :storeId ORDER BY se.joinDate DESC")
    List<StoreEmployee> findByStoreIdOrderByJoinDateDesc(@Param("storeId") String storeId);
}
