package com.stokmate.dto.order;

import com.stokmate.domain.Brand;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBrandRequest {

    @NotNull(message = "Brand is required")
    private Brand brand;
}
