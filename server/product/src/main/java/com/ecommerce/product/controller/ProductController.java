package com.ecommerce.product.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.product.dto.ApiResponseDTO;
import com.ecommerce.product.dto.PageMetaDTO;
import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ProductDetailDTO;
import com.ecommerce.product.dto.ProductFilterDTO;
import com.ecommerce.product.dto.ProductSummaryDTO;
import com.ecommerce.product.service.ProductService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Product API", description = "Endpoints for managing products")
public class ProductController {

        private final ProductService productService;

        @GetMapping("/{id}")
        @Operation(summary = "Get product by ID", description = "Returns a product with all details by its ID")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Product found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class))),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Product not found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class)))
        })
        public ResponseEntity<ApiResponseDTO<ProductDetailDTO>> getProductById(
                @Parameter(description = "Product ID", required = true) @PathVariable String id) {
                log.debug("REST request to get product by id: {}", id);
                ProductDetailDTO product = productService.getProductById(id);
                return ResponseEntity.ok(ApiResponseDTO.success(product, "Product retrieved successfully"));
        }

        @GetMapping
        @Operation(summary = "Get all products with filters", description = "Returns a paginated list of products with optional filters")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getAllProducts(
                @Parameter(description = "Search keyword") @RequestParam(required = false) String q,
                @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
                @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
                @Parameter(description = "Minimum rating") @RequestParam(required = false) BigDecimal minRating,
                @Parameter(description = "Maximum rating") @RequestParam(required = false) BigDecimal maxRating,
                @Parameter(description = "Brand IDs") @RequestParam(required = false) List<String> brandIds,
                @Parameter(description = "Brand names") @RequestParam(required = false) List<String> brandNames,
                @Parameter(description = "Category IDs") @RequestParam(required = false) List<String> categoryIds,
                @Parameter(description = "Inventory status") @RequestParam(required = false) String inventoryStatus,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
                @Parameter(description = "Sort field") @RequestParam(required = false) String sortBy,
                @Parameter(description = "Sort direction (asc or desc)") @RequestParam(defaultValue = "asc") String direction) {

        log.debug("REST request to get all products with filters");

        ProductFilterDTO filter = ProductFilterDTO.builder()
                .q(q)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .maxRating(maxRating)
                .brandIds(brandIds)
                .brandNames(brandNames)
                .categoryIds(categoryIds)
                .inventoryStatus(inventoryStatus)
                .sortBy(sortBy)
                .direction(direction)
                .build();

        PagedResponseDTO<ProductSummaryDTO> products = productService.getAllProductsWithFilters(filter, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                products.getContent(),
                "Products retrieved successfully",
                PageMetaDTO.fromPagedResponse(products)));
        }


        @GetMapping("/bulk")
        @Operation(summary = "Get products by IDs", description = "Returns a list of products by their IDs")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getProductsByIds(
                @Parameter(description = "List of product IDs", required = true) @RequestParam List<String> ids) {
                log.debug("REST request to get products by ids: {}", ids);
                List<ProductSummaryDTO> products = productService.getProductsByIds(ids);
                return ResponseEntity.ok(ApiResponseDTO.success(products, "Products retrieved successfully"));
        }

        @GetMapping("/category/{categoryId}")
        @Operation(summary = "Get products by category", description = "Returns a paginated list of products by category ID")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getProductsByCategory(
                @Parameter(description = "Category ID", required = true) @PathVariable String categoryId,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
                log.debug("REST request to get products by category id: {}", categoryId);
                PagedResponseDTO<ProductSummaryDTO> products = productService.getProductsByCategory(categoryId, page,
                        size);

                return ResponseEntity.ok(ApiResponseDTO.success(
                        products.getContent(),
                        "Products for category retrieved successfully",
                        PageMetaDTO.fromPagedResponse(products)));
        }

        @GetMapping("/brand/{brandId}")
        @Operation(summary = "Get products by brand", description = "Returns a paginated list of products by brand ID")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getProductsByBrand(
                @Parameter(description = "Brand ID", required = true) @PathVariable String brandId,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
                log.debug("REST request to get products by brand id: {}", brandId);
                PagedResponseDTO<ProductSummaryDTO> products = productService.getProductsByBrand(brandId, page, size);

                return ResponseEntity.ok(ApiResponseDTO.success(
                        products.getContent(),
                        "Products for brand retrieved successfully",
                        PageMetaDTO.fromPagedResponse(products)));
        }

        @GetMapping("/price-range")
        @Operation(summary = "Get products by price range", description = "Returns a paginated list of products by price range")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getProductsByPriceRange(
                @Parameter(description = "Minimum price") @RequestParam BigDecimal minPrice,
                @Parameter(description = "Maximum price") @RequestParam BigDecimal maxPrice,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
                log.debug("REST request to get products by price range: {} - {}", minPrice, maxPrice);
                PagedResponseDTO<ProductSummaryDTO> products = productService.getProductsByPriceRange(minPrice,
                        maxPrice, page, size);

                return ResponseEntity.ok(ApiResponseDTO.success(
                        products.getContent(),
                        "Products within price range retrieved successfully",
                        PageMetaDTO.fromPagedResponse(products)));
                }

        @GetMapping("/search")
        @Operation(summary = "Search products with filters", description = "Returns a paginated list of products by search filters")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> searchProducts(
                @Parameter(description = "Search keyword", required = true) @RequestParam String q,
                @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
                @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
                @Parameter(description = "Minimum rating") @RequestParam(required = false) BigDecimal minRating,
                @Parameter(description = "Maximum rating") @RequestParam(required = false) BigDecimal maxRating,
                @Parameter(description = "Brand IDs") @RequestParam(required = false) List<String> brandIds,
                @Parameter(description = "Brand names") @RequestParam(required = false) List<String> brandNames,
                @Parameter(description = "Category IDs") @RequestParam(required = false) List<String> categoryIds,
                @Parameter(description = "Inventory status") @RequestParam(required = false) String inventoryStatus,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
                @Parameter(description = "Sort field") @RequestParam(required = false) String sortBy,
                @Parameter(description = "Sort direction (asc or desc)") @RequestParam(defaultValue = "asc") String direction) {
        
        log.debug("REST request to search products with keyword: {} and filters", q);
        
        ProductFilterDTO filter = ProductFilterDTO.builder()
                .q(q)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .maxRating(maxRating)
                .brandIds(brandIds)
                .brandNames(brandNames)
                .categoryIds(categoryIds)
                .inventoryStatus(inventoryStatus)
                .sortBy(sortBy)
                .direction(direction)
                .build();
        
        PagedResponseDTO<ProductSummaryDTO> products = productService.searchProductsWithFilters(filter, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                products.getContent(),
                "Search results retrieved successfully",
                PageMetaDTO.fromPagedResponse(products)));
        }

        @GetMapping("/top-selling")
        @Operation(summary = "Get top selling products with filters", description = "Returns a paginated list of top selling products with optional filters")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getTopSellingProducts(
                @Parameter(description = "Search keyword") @RequestParam(required = false) String q,
                @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
                @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
                @Parameter(description = "Minimum rating") @RequestParam(required = false) BigDecimal minRating,
                @Parameter(description = "Maximum rating") @RequestParam(required = false) BigDecimal maxRating,
                @Parameter(description = "Brand IDs") @RequestParam(required = false) List<String> brandIds,
                @Parameter(description = "Brand names") @RequestParam(required = false) List<String> brandNames,
                @Parameter(description = "Category IDs") @RequestParam(required = false) List<String> categoryIds,
                @Parameter(description = "Inventory status") @RequestParam(required = false) String inventoryStatus,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        log.debug("REST request to get top selling products with filters");
        
        ProductFilterDTO filter = ProductFilterDTO.builder()
                .q(q)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .maxRating(maxRating)
                .brandIds(brandIds)
                .brandNames(brandNames)
                .categoryIds(categoryIds)
                .inventoryStatus(inventoryStatus)
                .sortBy("allTimeQuantitySold")
                .direction("desc")
                .build();
        
        PagedResponseDTO<ProductSummaryDTO> products = productService.getTopSellingProductsWithFilters(filter, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                products.getContent(),
                "Top selling products retrieved successfully",
                PageMetaDTO.fromPagedResponse(products)));
        }

        @GetMapping("/top-rated")
        @Operation(summary = "Get top rated products with filters", description = "Returns a paginated list of top rated products with optional filters")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getTopRatedProducts(
                @Parameter(description = "Search keyword") @RequestParam(required = false) String q,
                @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
                @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
                @Parameter(description = "Minimum rating") @RequestParam(required = false) BigDecimal minRating,
                @Parameter(description = "Maximum rating") @RequestParam(required = false) BigDecimal maxRating,
                @Parameter(description = "Brand IDs") @RequestParam(required = false) List<String> brandIds,
                @Parameter(description = "Brand names") @RequestParam(required = false) List<String> brandNames,
                @Parameter(description = "Category IDs") @RequestParam(required = false) List<String> categoryIds,
                @Parameter(description = "Inventory status") @RequestParam(required = false) String inventoryStatus,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        log.debug("REST request to get top rated products with filters");
        
        ProductFilterDTO filter = ProductFilterDTO.builder()
                .q(q)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .maxRating(maxRating)
                .brandIds(brandIds)
                .brandNames(brandNames)
                .categoryIds(categoryIds)
                .inventoryStatus(inventoryStatus)
                .sortBy("ratingAverage")
                .direction("desc")
                .build();
        
        PagedResponseDTO<ProductSummaryDTO> products = productService.getTopRatedProductsWithFilters(filter, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                products.getContent(),
                "Top rated products retrieved successfully",
                PageMetaDTO.fromPagedResponse(products)));
        }

        @GetMapping("/new-arrivals")
        @Operation(summary = "Get new arrivals with filters", description = "Returns a paginated list of new arrival products with optional filters")
        public ResponseEntity<ApiResponseDTO<List<ProductSummaryDTO>>> getNewArrivals(
                @Parameter(description = "Search keyword") @RequestParam(required = false) String q,
                @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
                @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
                @Parameter(description = "Minimum rating") @RequestParam(required = false) BigDecimal minRating,
                @Parameter(description = "Maximum rating") @RequestParam(required = false) BigDecimal maxRating,
                @Parameter(description = "Brand IDs") @RequestParam(required = false) List<String> brandIds,
                @Parameter(description = "Brand names") @RequestParam(required = false) List<String> brandNames,
                @Parameter(description = "Category IDs") @RequestParam(required = false) List<String> categoryIds,
                @Parameter(description = "Inventory status") @RequestParam(required = false) String inventoryStatus,
                @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
                @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        log.debug("REST request to get new arrivals with filters");
        
        ProductFilterDTO filter = ProductFilterDTO.builder()
                .q(q)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .maxRating(maxRating)
                .brandIds(brandIds)
                .brandNames(brandNames)
                .categoryIds(categoryIds)
                .inventoryStatus(inventoryStatus)
                .sortBy("createdAt")
                .direction("desc")
                .build();
        
        PagedResponseDTO<ProductSummaryDTO> products = productService.getNewArrivalsWithFilters(filter, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                products.getContent(),
                "New arrivals retrieved successfully",
                PageMetaDTO.fromPagedResponse(products)));
        }
}