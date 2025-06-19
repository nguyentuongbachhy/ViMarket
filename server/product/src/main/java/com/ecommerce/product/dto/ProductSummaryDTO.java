package com.ecommerce.product.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryDTO {
    private String id;
    private String name;
    private String shortDescription;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal ratingAverage;
    private Integer reviewCount;
    private String inventoryStatus;
    private Integer quantitySold;

    private BrandDTO brand;
    private SellerDTO seller;
    private List<ImageDTO> images;
    private List<CategoryDTO> categories;
}