package com.stokmate.mapper;

import com.stokmate.domain.BalanceLedger;
import com.stokmate.domain.BalancePayment;
import com.stokmate.dto.balance.BalanceLedgerResponse;
import com.stokmate.dto.balance.BalancePaymentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BalanceLedgerMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.firstName", target = "customerFirstName")
    @Mapping(source = "customer.lastName", target = "customerLastName")
    @Mapping(source = "contractType", target = "contractType")
    @Mapping(expression = "java(entity.getContractType() == com.stokmate.domain.ContractType.SALE ? entity.getSaleId() : entity.getOrderId())", target = "contractId")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "payments", target = "payments")
    BalanceLedgerResponse toResponse(BalanceLedger entity);

    List<BalanceLedgerResponse> toResponseList(List<BalanceLedger> entities);

    @Mapping(source = "paidBy.firstName", target = "paidByFirstName")
    @Mapping(source = "paidBy.lastName", target = "paidByLastName")
    @Mapping(source = "paidBy.email", target = "paidByEmail")
    BalancePaymentResponse toPaymentResponse(BalancePayment payment);

    List<BalancePaymentResponse> toPaymentResponseList(List<BalancePayment> payments);
}
