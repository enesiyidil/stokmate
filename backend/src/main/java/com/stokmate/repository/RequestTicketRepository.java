package com.stokmate.repository;

import com.stokmate.domain.RequestTicket;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestTicketRepository extends JpaRepository<RequestTicket, UUID> {
    List<RequestTicket> findByOwnerId(UUID ownerId);
}
