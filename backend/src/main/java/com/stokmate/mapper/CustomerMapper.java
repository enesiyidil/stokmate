package com.stokmate.mapper;

import com.stokmate.domain.Customer;
import com.stokmate.dto.customer.CustomerRequest;
import com.stokmate.dto.customer.CustomerResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CustomerMapper {
    Customer toEntity(CustomerRequest request);

    CustomerResponse toResponse(Customer customer);

    void update(@MappingTarget Customer customer, CustomerRequest request);
}
