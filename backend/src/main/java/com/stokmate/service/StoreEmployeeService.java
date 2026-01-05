package com.stokmate.service;

import com.stokmate.domain.Store;
import com.stokmate.domain.StoreEmployee;
import com.stokmate.domain.User;
import com.stokmate.dto.store.StoreEmployeeRequest;
import com.stokmate.dto.store.StoreEmployeeResponse;
import com.stokmate.exception.BadRequestException;
import com.stokmate.exception.NotFoundException;
import com.stokmate.mapper.StoreEmployeeMapper;
import com.stokmate.repository.StoreEmployeeRepository;
import com.stokmate.repository.StoreRepository;
import com.stokmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreEmployeeService {

    private final StoreEmployeeRepository storeEmployeeRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final StoreEmployeeMapper storeEmployeeMapper;

    @Transactional
    public StoreEmployeeResponse assignEmployeeToStore(String storeId, StoreEmployeeRequest request) {
        // Validate store exists
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found"));

        // Validate user exists
        UUID userId = UUID.fromString(request.getUserId());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Validate user role (only STORE_MANAGER and STORE_EMPLOYEE can be assigned)
        if (!user.getRole().name().equals("STORE_MANAGER") &&
                !user.getRole().name().equals("STORE_EMPLOYEE")) {
            throw new BadRequestException("Only store employees can be assigned to stores");
        }

        // Deactivate any existing active assignment for this user
        Optional<StoreEmployee> existingAssignment = storeEmployeeRepository.findByUserIdAndActive(userId, true);
        existingAssignment.ifPresent(assignment -> {
            assignment.setActive(false);
            storeEmployeeRepository.save(assignment);
        });

        // Create new assignment
        StoreEmployee storeEmployee = new StoreEmployee();
        storeEmployee.setStore(store);
        storeEmployee.setUser(user);
        storeEmployee.setJoinDate(request.getJoinDate());
        storeEmployee.setActive(true);

        StoreEmployee saved = storeEmployeeRepository.save(storeEmployee);
        return storeEmployeeMapper.toResponse(saved);
    }

    @Transactional
    public void removeEmployeeFromStore(String storeId, String userId) {
        UUID userUuid = UUID.fromString(userId);
        Optional<StoreEmployee> assignment = storeEmployeeRepository.findByUserIdAndActive(userUuid, true);

        if (assignment.isEmpty()) {
            throw new NotFoundException("Active assignment not found");
        }

        if (!assignment.get().getStore().getId().equals(storeId)) {
            throw new BadRequestException("User is not assigned to this store");
        }

        assignment.get().setActive(false);
        storeEmployeeRepository.save(assignment.get());
    }

    public List<StoreEmployeeResponse> getStoreEmployees(String storeId) {
        return storeEmployeeRepository.findByStoreIdAndActiveOrderByJoinDateDesc(storeId, true).stream()
                .map(storeEmployeeMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Optional<StoreEmployeeResponse> getUserCurrentStore(UUID userId) {
        return storeEmployeeRepository.findByUserIdAndActive(userId, true)
                .map(storeEmployeeMapper::toResponse);
    }
}
