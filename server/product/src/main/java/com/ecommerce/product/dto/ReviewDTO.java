package com.ecommerce.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private String id;
    private String userId;
    private BigDecimal rating;
    private String title;
    private String content;
    private Integer helpfulVotes;
    private Boolean verifiedPurchase;
    private LocalDateTime reviewDate;
}