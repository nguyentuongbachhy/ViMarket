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
public class ProductFilterDTO {
    private String q; // search keyword
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private BigDecimal minRating;
    private BigDecimal maxRating;
    private List<String> brandIds;
    private List<String> brandNames;
    private List<String> categoryIds;
    private String inventoryStatus;
    private String sortBy;
    private String direction; // asc, desc
    
    // Helper methods
    public boolean hasFilters() {
        return (q != null && !q.trim().isEmpty()) ||
               minPrice != null ||
               maxPrice != null ||
               minRating != null ||
               maxRating != null ||
               (brandIds != null && !brandIds.isEmpty()) ||
               (brandNames != null && !brandNames.isEmpty()) ||
               (categoryIds != null && !categoryIds.isEmpty()) ||
               (inventoryStatus != null && !inventoryStatus.trim().isEmpty());
    }
    
    public String getCacheKey() {
        StringBuilder sb = new StringBuilder();
        sb.append(q != null ? q : "").append("_");
        sb.append(minPrice != null ? minPrice : "").append("_");
        sb.append(maxPrice != null ? maxPrice : "").append("_");
        sb.append(minRating != null ? minRating : "").append("_");
        sb.append(maxRating != null ? maxRating : "").append("_");
        sb.append(brandIds != null ? String.join(",", brandIds) : "").append("_");
        sb.append(brandNames != null ? String.join(",", brandNames) : "").append("_");
        sb.append(categoryIds != null ? String.join(",", categoryIds) : "").append("_");
        sb.append(inventoryStatus != null ? inventoryStatus : "").append("_");
        sb.append(sortBy != null ? sortBy : "").append("_");
        sb.append(direction != null ? direction : "");
        return sb.toString();
    }
}