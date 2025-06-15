package com.ecommerce.product.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ReviewDTO;
import com.ecommerce.product.entity.Review;
import com.ecommerce.product.mapper.ProductMapper;
import com.ecommerce.product.repository.ReviewRepository;
import com.ecommerce.product.service.ReviewService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "reviewsByProduct", key = "{#productId, #page, #size, #sortBy}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ReviewDTO> getReviewsByProductId(String productId, int page, int size, String sortBy) {
        log.debug("Getting reviews for product id: {}, with sort: {}", productId, sortBy);

        Pageable pageable;
        Page<Review> reviewPage;

        if ("helpful".equalsIgnoreCase(sortBy)) {
            // Special case for helpful sorting
            reviewPage = reviewRepository.findByProductIdOrderByHelpfulVotesDesc(productId, PageRequest.of(page, size));
        } else if ("newest".equalsIgnoreCase(sortBy)) {
            // Special case for newest sorting
            reviewPage = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, PageRequest.of(page, size));
        } else {
            // Default sorting
            Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
            pageable = PageRequest.of(page, size, sort);
            reviewPage = reviewRepository.findByProductId(productId, pageable);
        }

        List<ReviewDTO> reviewDTOs = reviewPage.getContent().stream()
                .map(productMapper::toReviewDTO)
                .collect(Collectors.toList());

        return productMapper.toPagedResponseDTO(reviewPage, reviewDTOs);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "reviewsByUser", key = "{#userId, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ReviewDTO> getReviewsByUserId(String userId, int page, int size) {
        log.debug("Getting reviews for user id: {}", userId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviewPage = reviewRepository.findByUserId(userId, pageable);

        List<ReviewDTO> reviewDTOs = reviewPage.getContent().stream()
                .map(productMapper::toReviewDTO)
                .collect(Collectors.toList());

        return productMapper.toPagedResponseDTO(reviewPage, reviewDTOs);
    }

    // Phương thức để xóa cache khi có review mới hoặc review được cập nhật
    @CacheEvict(value = "reviewsByProduct", key = "{#productId, '*', '*', '*'}")
    public void evictReviewCacheForProduct(String productId) {
        log.debug("Evicting review cache for product id: {}", productId);
    }

    // Phương thức để xóa cache khi user thêm hoặc cập nhật review
    @CacheEvict(value = "reviewsByUser", key = "{#userId, '*', '*'}")
    public void evictReviewCacheForUser(String userId) {
        log.debug("Evicting review cache for user id: {}", userId);
    }
}