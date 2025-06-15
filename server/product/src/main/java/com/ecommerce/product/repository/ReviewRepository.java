package com.ecommerce.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.product.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    Page<Review> findByProductId(String productId, Pageable pageable);

    Page<Review> findByProductIdOrderByHelpfulVotesDesc(String productId, Pageable pageable);

    Page<Review> findByProductIdOrderByCreatedAtDesc(String productId, Pageable pageable);

    Page<Review> findByUserId(String userId, Pageable pageable);
}