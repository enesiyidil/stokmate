package com.stokmate.mapper;

import com.stokmate.domain.Product;
import com.stokmate.dto.product.ProductRequest;
import com.stokmate.dto.product.ProductResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {

    @org.mapstruct.Mapping(target = "arrivalPrice", source = "unitPrice")
    Product toEntity(ProductRequest request);

    @org.mapstruct.Mapping(target = "unitPrice", source = "arrivalPrice")
    ProductResponse toResponse(Product product);

    @org.mapstruct.Mapping(target = "arrivalPrice", source = "unitPrice")
    void updateProductFromRequest(ProductRequest request, @MappingTarget Product product);
}
