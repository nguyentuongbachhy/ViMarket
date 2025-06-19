package com.ecommerce.product.service;

import java.math.BigDecimal;
import java.util.List;

import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ProductDetailDTO;
import com.ecommerce.product.dto.ProductFilterDTO;
import com.ecommerce.product.dto.ProductSummaryDTO;


public interface ProductService {
    // Core product operations
    ProductDetailDTO getProductById(String id);
    PagedResponseDTO<ProductSummaryDTO> getAllProducts(int page, int size, String sortBy, String direction);
    List<ProductSummaryDTO> getProductsByIds(List<String> ids);
    
    // Product filtering & search 
    PagedResponseDTO<ProductSummaryDTO> getProductsByCategory(String categoryId, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getProductsByBrand(String brandId, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> searchProducts(String keyword, int page, int size);
    
    // Product analytics (read-only)
    PagedResponseDTO<ProductSummaryDTO> getTopSellingProducts(int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getTopRatedProducts(int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getNewArrivals(int page, int size);
    
    // Product metadata updates (triggered by events)
    void updateProductSalesStats(String productId, int quantitySold);
    void updateProductRating(String productId, BigDecimal newRating, int reviewCount);
    void updateInventoryStatus(String productId, String status);

    // Get products with filters
    PagedResponseDTO<ProductSummaryDTO> getAllProductsWithFilters(ProductFilterDTO filter, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> searchProductsWithFilters(ProductFilterDTO filter, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getTopSellingProductsWithFilters(ProductFilterDTO filter, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getTopRatedProductsWithFilters(ProductFilterDTO filter, int page, int size);
    PagedResponseDTO<ProductSummaryDTO> getNewArrivalsWithFilters(ProductFilterDTO filter, int page, int size);

    // Clear cache
    void clearProductCaches(String productId);
}