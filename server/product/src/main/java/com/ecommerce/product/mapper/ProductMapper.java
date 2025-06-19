package com.ecommerce.product.mapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;
import org.springframework.data.domain.Page;

import com.ecommerce.product.dto.BrandDTO;
import com.ecommerce.product.dto.CategoryDTO;
import com.ecommerce.product.dto.ImageDTO;
import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ProductDetailDTO;
import com.ecommerce.product.dto.ProductSummaryDTO;
import com.ecommerce.product.dto.ReviewDTO;
import com.ecommerce.product.dto.SellerDTO;
import com.ecommerce.product.dto.SpecificationDTO;
import com.ecommerce.product.entity.Brand;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Image;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.entity.Review;
import com.ecommerce.product.entity.Seller;
import com.ecommerce.product.entity.Specification;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    ProductMapper INSTANCE = Mappers.getMapper(ProductMapper.class);

    // Product -> ProductDetailDTO với tất cả các mối quan hệ
    @Mapping(target = "reviews", source = "reviews", qualifiedByName = "limitReviews")
    @Mapping(target = "categories", source = "categories", qualifiedByName = "safeMapCategories")
    ProductDetailDTO toProductDetailDTO(Product product);

    // Product -> ProductSummaryDTO (thông tin giới hạn)
    @Mapping(target = "images", source = "images", qualifiedByName = "limitImages")
    @Mapping(target = "categories", source = "categories", qualifiedByName = "safeMapCategories")
    ProductSummaryDTO toProductSummaryDTO(Product product);

    // Brand -> BrandDTO
    BrandDTO toBrandDTO(Brand brand);

    // Seller -> SellerDTO
    SellerDTO toSellerDTO(Seller seller);

    // Category -> CategoryDTO
    CategoryDTO toCategoryDTO(Category category);

    // Image -> ImageDTO
    ImageDTO toImageDTO(Image image);

    // Specification -> SpecificationDTO
    SpecificationDTO toSpecificationDTO(Specification specification);

    // Review -> ReviewDTO
    ReviewDTO toReviewDTO(Review review);

    // List transformations
    @Named("safeMapCategories")
    default List<CategoryDTO> safeMapCategories(Set<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Tạo một danh sách mới từ Set để tránh ConcurrentModificationException
            List<Category> safeList = new ArrayList<>(categories);
            return safeList.stream()
                    .map(this::toCategoryDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    default List<ProductSummaryDTO> toProductSummaryDTOList(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Collections.emptyList();
        }

        List<ProductSummaryDTO> result = new ArrayList<>();
        for (Product product : products) {
            try {
                result.add(toProductSummaryDTO(product));
            } catch (Exception e) {
                // Skip problematic product but continue with others
            }
        }
        return result;
    }

    @Named("limitImages")
    default List<ImageDTO> limitImages(List<Image> images) {
        if (images == null || images.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Sắp xếp và giới hạn số lượng hình ảnh
            return images.stream()
                    .sorted((i1, i2) -> {
                        if (i1.getPosition() == null)
                            return 1;
                        if (i2.getPosition() == null)
                            return -1;
                        return i1.getPosition().compareTo(i2.getPosition());
                    })
                    .limit(3)
                    .map(this::toImageDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @Named("limitReviews")
    default List<ReviewDTO> limitReviews(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Giới hạn số lượng đánh giá
            return reviews.stream()
                    .limit(5)
                    .map(this::toReviewDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // Paged response mapper
    default <T> PagedResponseDTO<T> toPagedResponseDTO(Page<?> page, List<T> content) {
        return PagedResponseDTO.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}