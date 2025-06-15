package com.ecommerce.product.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.product.dto.ApiResponseDTO;
import com.ecommerce.product.dto.CategoryDTO;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.mapper.ProductMapper;
import com.ecommerce.product.repository.CategoryRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Category API", description = "Endpoints for managing categories")
public class CategoryController {

        private final CategoryRepository categoryRepository;
        private final ProductMapper productMapper;

        @GetMapping
        @Operation(summary = "Get all categories", description = "Returns a list of all categories")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getAllCategories() {
                log.debug("REST request to get all categories");
                List<Category> categories = categoryRepository.findAll();
                List<CategoryDTO> categoryDTOs = categories.stream()
                                .map(productMapper::toCategoryDTO)
                                .toList();
                return ResponseEntity.ok(ApiResponseDTO.success(categoryDTOs, "Categories retrieved successfully"));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get category by ID", description = "Returns a category by its ID")
        @ApiResponses(value = {
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class)))
        })
        public ResponseEntity<ApiResponseDTO<CategoryDTO>> getCategoryById(
                        @Parameter(description = "Category ID", required = true) @PathVariable String id) {
                log.debug("REST request to get category by id: {}", id);
                return categoryRepository.findById(id)
                                .map(productMapper::toCategoryDTO)
                                .map(categoryDTO -> ApiResponseDTO.success(categoryDTO,
                                                "Category retrieved successfully"))
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/roots")
        @Operation(summary = "Get root categories", description = "Returns a list of root categories (level 1)")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getRootCategories() {
                log.debug("REST request to get root categories");
                List<Category> rootCategories = categoryRepository.findByParentIdIsNull();
                List<CategoryDTO> categoryDTOs = rootCategories.stream()
                                .map(productMapper::toCategoryDTO)
                                .toList();
                return ResponseEntity
                                .ok(ApiResponseDTO.success(categoryDTOs, "Root categories retrieved successfully"));
        }

        @GetMapping("/parent/{parentId}")
        @Operation(summary = "Get subcategories", description = "Returns a list of subcategories for a given parent category")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getSubcategories(
                        @Parameter(description = "Parent category ID", required = true) @PathVariable String parentId) {
                log.debug("REST request to get subcategories for parent id: {}", parentId);
                List<Category> subcategories = categoryRepository.findByParentId(parentId);
                List<CategoryDTO> categoryDTOs = subcategories.stream()
                                .map(productMapper::toCategoryDTO)
                                .toList();
                return ResponseEntity.ok(ApiResponseDTO.success(categoryDTOs, "Subcategories retrieved successfully"));
        }

        // NEW: Alias endpoint for subcategories (more RESTful)
        @GetMapping("/{id}/subcategories")
        @Operation(summary = "Get subcategories by parent ID", description = "Returns a list of subcategories for a given parent category (alias for /parent/{parentId})")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getSubcategoriesById(
                        @Parameter(description = "Parent category ID", required = true) @PathVariable String id) {
                log.debug("REST request to get subcategories for category id: {}", id);
                return getSubcategories(id);
        }

        // NEW: Get category path/hierarchy from root to current category
        @GetMapping("/{id}/path")
        @Operation(summary = "Get category path", description = "Returns the hierarchy path from root to the specified category")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getCategoryPath(
                        @Parameter(description = "Category ID", required = true) @PathVariable String id) {
                log.debug("REST request to get category path for id: {}", id);
                
                // Build path manually using iterative approach (more reliable than recursive SQL)
                List<CategoryDTO> path = new ArrayList<>();
                String currentId = id;
                
                while (currentId != null) {
                        Category category = categoryRepository.findById(currentId).orElse(null);
                        if (category == null) {
                                break;
                        }
                        
                        path.add(productMapper.toCategoryDTO(category));
                        currentId = category.getParentId();
                }
                
                // Reverse to get root-to-current order
                Collections.reverse(path);
                
                return ResponseEntity.ok(ApiResponseDTO.success(path, "Category path retrieved successfully"));
        }

        // NEW: Get category hierarchy (breadcrumb-friendly)
        @GetMapping("/{id}/hierarchy")
        @Operation(summary = "Get category hierarchy", description = "Returns the hierarchy breadcrumb for the specified category")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getCategoryHierarchy(
                        @Parameter(description = "Category ID", required = true) @PathVariable String id) {
                log.debug("REST request to get category hierarchy for id: {}", id);
                
                // Same as path but exclude the current category (for breadcrumb)
                List<CategoryDTO> hierarchy = new ArrayList<>();
                
                // First get the current category to find its parent
                Category currentCategory = categoryRepository.findById(id).orElse(null);
                if (currentCategory == null) {
                        return ResponseEntity.notFound().build();
                }
                
                String parentId = currentCategory.getParentId();
                
                // Build hierarchy path (excluding current category)
                while (parentId != null) {
                        Category category = categoryRepository.findById(parentId).orElse(null);
                        if (category == null) {
                                break;
                        }
                        
                        hierarchy.add(productMapper.toCategoryDTO(category));
                        parentId = category.getParentId();
                }
                
                // Reverse to get root-to-parent order
                Collections.reverse(hierarchy);
                
                return ResponseEntity.ok(ApiResponseDTO.success(hierarchy, "Category hierarchy retrieved successfully"));
        }

        @GetMapping("/level/{level}")
        @Operation(summary = "Get categories by level", description = "Returns a list of categories by their level")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getCategoriesByLevel(
                        @Parameter(description = "Category level", required = true) @PathVariable Integer level) {
                log.debug("REST request to get categories by level: {}", level);
                List<Category> categories = categoryRepository.findByLevel(level);
                List<CategoryDTO> categoryDTOs = categories.stream()
                                .map(productMapper::toCategoryDTO)
                                .toList();
                return ResponseEntity
                                .ok(ApiResponseDTO.success(categoryDTOs, "Categories by level retrieved successfully"));
        }

        @GetMapping("/product/{productId}")
        @Operation(summary = "Get categories by product", description = "Returns a list of categories for a given product")
        public ResponseEntity<ApiResponseDTO<List<CategoryDTO>>> getCategoriesByProduct(
                        @Parameter(description = "Product ID", required = true) @PathVariable String productId) {
                log.debug("REST request to get categories for product id: {}", productId);
                List<Category> categories = categoryRepository.findByProductId(productId);
                List<CategoryDTO> categoryDTOs = categories.stream()
                                .map(productMapper::toCategoryDTO)
                                .toList();
                return ResponseEntity
                                .ok(ApiResponseDTO.success(categoryDTOs, "Product categories retrieved successfully"));
        }

        // NEW: Check if category has subcategories
        @GetMapping("/{id}/has-subcategories")
        @Operation(summary = "Check if category has subcategories", description = "Returns true if the category has subcategories")
        public ResponseEntity<ApiResponseDTO<Boolean>> hasSubcategories(
                        @Parameter(description = "Category ID", required = true) @PathVariable String id) {
                log.debug("REST request to check if category has subcategories: {}", id);
                List<Category> subcategories = categoryRepository.findByParentId(id);
                boolean hasSubcategories = !subcategories.isEmpty();
                return ResponseEntity.ok(ApiResponseDTO.success(hasSubcategories, "Subcategory check completed"));
        }
}