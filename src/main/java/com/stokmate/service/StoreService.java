package com.stokmate.service;

import com.stokmate.domain.Store;
import com.stokmate.domain.User;
import com.stokmate.dto.store.StoreCreateRequest;
import com.stokmate.dto.store.StoreResponse;
import com.stokmate.dto.store.StoreUpdateRequest;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.StoreMapper;
import com.stokmate.repository.StoreRepository;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final StoreMapper storeMapper;

    @Transactional
    public StoreResponse createStore(StoreCreateRequest request) {
        // Check if code already exists
        storeRepository.findByCode(request.getCode()).ifPresent(s -> {
            throw new BadRequestException("Store code already exists: " + request.getCode());
        });

        Store store = new Store();
        store.setCode(request.getCode());
        store.setName(request.getName());
        store.setAddress(request.getAddress());
        store.setPhone(request.getPhone());
        store.setEmail(request.getEmail());
        store.setActive(true);

        // Set manager if provided
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(UUID.fromString(request.getManagerId()))
                    .orElseThrow(() -> new NotFoundException("Manager not found"));
            store.setManager(manager);
        }

        Store saved = storeRepository.save(store);
        return storeMapper.toResponse(saved);
    }

    @Transactional
    public StoreResponse updateStore(String id, StoreUpdateRequest request) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Store not found"));

        if (request.getName() != null) {
            store.setName(request.getName());
        }
        if (request.getAddress() != null) {
            store.setAddress(request.getAddress().trim().isEmpty() ? null : request.getAddress());
        }
        if (request.getPhone() != null) {
            store.setPhone(request.getPhone().trim().isEmpty() ? null : request.getPhone());
        }
        if (request.getEmail() != null) {
            store.setEmail(request.getEmail().trim().isEmpty() ? null : request.getEmail());
        }
        if (request.getActive() != null) {
            store.setActive(request.getActive());
        }
        if (request.getManagerId() != null && !request.getManagerId().trim().isEmpty()) {
            User manager = userRepository.findById(UUID.fromString(request.getManagerId()))
                    .orElseThrow(() -> new NotFoundException("Manager not found"));
            store.setManager(manager);
        }

        Store updated = storeRepository.save(store);
        return storeMapper.toResponse(updated);
    }

    public StoreResponse getStoreById(String id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Store not found"));
        return storeMapper.toResponse(store);
    }

    public List<StoreResponse> listAllStores() {
        return storeRepository.findAll().stream()
                .map(storeMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<StoreResponse> listActiveStores() {
        return storeRepository.findByActive(true).stream()
                .map(storeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteStore(String id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Store not found"));
        store.setActive(false);
        storeRepository.save(store);
    }
}
