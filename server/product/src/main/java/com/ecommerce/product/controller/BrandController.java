package com.ecommerce.product.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.product.dto.ApiResponseDTO;
import com.ecommerce.product.dto.BrandDTO;
import com.ecommerce.product.entity.Brand;
import com.ecommerce.product.mapper.ProductMapper;
import com.ecommerce.product.repository.BrandRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/brands")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Brand API", description = "Endpoints for managing brands")
public class BrandController {

        private final BrandRepository brandRepository;
        private final ProductMapper productMapper;

        @GetMapping
        @Operation(summary = "Get all brands", description = "Returns a list of all brands")
        public ResponseEntity<ApiResponseDTO<List<BrandDTO>>> getAllBrands() {
                log.debug("REST request to get all brands");
                List<Brand> brands = brandRepository.findAll();
                List<BrandDTO> brandDTOs = brands.stream()
                                .map(productMapper::toBrandDTO)
                                .toList();
                return ResponseEntity.ok(ApiResponseDTO.success(brandDTOs, "Brands retrieved successfully"));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get brand by ID", description = "Returns a brand by its ID")
        @ApiResponses(value = {
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Brand found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Brand not found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class)))
        })
        public ResponseEntity<ApiResponseDTO<BrandDTO>> getBrandById(
                        @Parameter(description = "Brand ID", required = true) @PathVariable String id) {
                log.debug("REST request to get brand by id: {}", id);
                return brandRepository.findById(id)
                                .map(productMapper::toBrandDTO)
                                .map(brandDTO -> ApiResponseDTO.success(brandDTO, "Brand retrieved successfully"))
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/name/{name}")
        @Operation(summary = "Get brand by name", description = "Returns a brand by its name")
        @ApiResponses(value = {
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Brand found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Brand not found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class)))
        })
        public ResponseEntity<ApiResponseDTO<BrandDTO>> getBrandByName(
                        @Parameter(description = "Brand name", required = true) @PathVariable String name) {
                log.debug("REST request to get brand by name: {}", name);
                return brandRepository.findByName(name)
                                .map(productMapper::toBrandDTO)
                                .map(brandDTO -> ApiResponseDTO.success(brandDTO, "Brand retrieved successfully"))
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/slug/{slug}")
        @Operation(summary = "Get brand by slug", description = "Returns a brand by its slug")
        @ApiResponses(value = {
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Brand found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Brand not found", content = @Content(schema = @Schema(implementation = ApiResponseDTO.class)))
        })
        public ResponseEntity<ApiResponseDTO<BrandDTO>> getBrandBySlug(
                        @Parameter(description = "Brand slug", required = true) @PathVariable String slug) {
                log.debug("REST request to get brand by slug: {}", slug);
                return brandRepository.findBySlug(slug)
                                .map(productMapper::toBrandDTO)
                                .map(brandDTO -> ApiResponseDTO.success(brandDTO, "Brand retrieved successfully"))
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }
}