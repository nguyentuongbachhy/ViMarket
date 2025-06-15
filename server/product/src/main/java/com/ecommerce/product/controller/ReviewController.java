package com.ecommerce.product.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.product.dto.ApiResponseDTO;
import com.ecommerce.product.dto.PageMetaDTO;
import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ReviewDTO;
import com.ecommerce.product.service.ReviewService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Review API", description = "Endpoints for managing reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get reviews by product ID", description = "Returns a paginated list of reviews for a product")
    public ResponseEntity<ApiResponseDTO<java.util.List<ReviewDTO>>> getReviewsByProductId(
            @Parameter(description = "Product ID", required = true) @PathVariable String productId,
            @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by (helpful, newest, default)") @RequestParam(defaultValue = "default") String sortBy) {
        log.debug("REST request to get reviews for product id: {}", productId);
        PagedResponseDTO<ReviewDTO> reviews = reviewService.getReviewsByProductId(productId, page, size, sortBy);

        return ResponseEntity.ok(ApiResponseDTO.success(
                reviews.getContent(),
                "Product reviews retrieved successfully",
                PageMetaDTO.fromPagedResponse(reviews)));
    }

    @GetMapping("/user/me")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get reviews by authenticated user", description = "Returns a paginated list of reviews created by the authenticated user")
    public ResponseEntity<ApiResponseDTO<java.util.List<ReviewDTO>>> getMyReviews(
            @AuthenticationPrincipal String userId,
            @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        log.debug("REST request to get reviews for authenticated user");
        PagedResponseDTO<ReviewDTO> reviews = reviewService.getReviewsByUserId(userId, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                reviews.getContent(),
                "Your reviews retrieved successfully",
                PageMetaDTO.fromPagedResponse(reviews)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get reviews by user ID", description = "Returns a paginated list of reviews created by a specific user")
    public ResponseEntity<ApiResponseDTO<java.util.List<ReviewDTO>>> getReviewsByUserId(
            @Parameter(description = "User ID", required = true) @PathVariable String userId,
            @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        log.debug("REST request to get reviews for user id: {}", userId);
        PagedResponseDTO<ReviewDTO> reviews = reviewService.getReviewsByUserId(userId, page, size);

        return ResponseEntity.ok(ApiResponseDTO.success(
                reviews.getContent(),
                "User reviews retrieved successfully",
                PageMetaDTO.fromPagedResponse(reviews)));
    }
}