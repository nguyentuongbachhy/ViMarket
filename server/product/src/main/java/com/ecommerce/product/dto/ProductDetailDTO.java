package com.ecommerce.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailDTO {
    private String id;
    private String name;
    private String shortDescription;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String description;
    private BigDecimal ratingAverage;
    private Integer reviewCount;
    private String inventoryStatus;
    private Integer allTimeQuantitySold;
    private Integer quantitySold;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private BrandDTO brand;
    private SellerDTO seller;
    private List<ImageDTO> images;
    private List<SpecificationDTO> specifications;
    private List<CategoryDTO> categories;
    private List<ReviewDTO> reviews;
}