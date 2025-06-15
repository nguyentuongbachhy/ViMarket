package com.ecommerce.product.service;

import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ReviewDTO;

public interface ReviewService {

    /**
     * Get reviews for a product with pagination
     */
    PagedResponseDTO<ReviewDTO> getReviewsByProductId(String productId, int page, int size, String sortBy);

    /**
     * Get reviews created by a user
     */
    PagedResponseDTO<ReviewDTO> getReviewsByUserId(String userId, int page, int size);
}