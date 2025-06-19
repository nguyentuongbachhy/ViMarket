package com.ecommerce.product.grpc.mapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.ecommerce.grpc.product.BrandInfo;
import com.ecommerce.grpc.product.CategoryInfo;
import com.ecommerce.grpc.product.ImageInfo;
import com.ecommerce.grpc.product.ProductSummary;
import com.ecommerce.product.dto.ProductSummaryDTO;

@Component
public class GrpcMapper {

    public ProductSummary toProductSummaryProto(ProductSummaryDTO dto) {
        if (dto == null) {
            return ProductSummary.getDefaultInstance();
        }

        ProductSummary.Builder builder = ProductSummary.newBuilder()
                .setId(dto.getId())
                .setName(dto.getName())
                .setPrice(dto.getPrice().doubleValue())
                .setInventoryStatus(dto.getInventoryStatus() != null ? dto.getInventoryStatus() : "");

        if (dto.getShortDescription() != null) {
            builder.setShortDescription(dto.getShortDescription());
        }

        if (dto.getOriginalPrice() != null) {
            builder.setOriginalPrice(dto.getOriginalPrice().doubleValue());
        }

        if (dto.getRatingAverage() != null) {
            builder.setRatingAverage(dto.getRatingAverage().doubleValue());
        }

        if (dto.getReviewCount() != null) {
            builder.setReviewCount(dto.getReviewCount());
        }

        if (dto.getQuantitySold() != null) {
            builder.setQuantitySold(dto.getQuantitySold());
        }

        // Brand info
        if (dto.getBrand() != null) {
            BrandInfo brandInfo = BrandInfo.newBuilder()
                    .setId(dto.getBrand().getId())
                    .setName(dto.getBrand().getName())
                    .build();

            if (dto.getBrand().getSlug() != null) {
                brandInfo = brandInfo.toBuilder().setSlug(dto.getBrand().getSlug()).build();
            }

            if (dto.getBrand().getCountryOfOrigin() != null) {
                brandInfo = brandInfo.toBuilder().setCountryOfOrigin(dto.getBrand().getCountryOfOrigin()).build();
            }

            builder.setBrand(brandInfo);
        }

        // Images
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            List<ImageInfo> imageInfos = dto.getImages().stream()
                    .map(img -> ImageInfo.newBuilder()
                            .setId(img.getId())
                            .setUrl(img.getUrl())
                            .setPosition(img.getPosition() != null ? img.getPosition() : 0)
                            .build())
                    .collect(Collectors.toList());

            builder.addAllImages(imageInfos);
        }

        // Categories
        if (dto.getCategories() != null && !dto.getCategories().isEmpty()) {
            List<CategoryInfo> categoryInfos = dto.getCategories().stream()
                    .map(cat -> {
                        CategoryInfo.Builder catBuilder = CategoryInfo.newBuilder()
                                .setId(cat.getId())
                                .setName(cat.getName());

                        if (cat.getUrl() != null) {
                            catBuilder.setUrl(cat.getUrl());
                        }

                        if (cat.getParentId() != null) {
                            catBuilder.setParentId(cat.getParentId());
                        }

                        if (cat.getLevel() != null) {
                            catBuilder.setLevel(cat.getLevel());
                        }

                        return catBuilder.build();
                    })
                    .collect(Collectors.toList());

            builder.addAllCategories(categoryInfos);
        }

        return builder.build();
    }

    public List<ProductSummary> toProductSummaryList(List<ProductSummaryDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return new ArrayList<>();
        }

        return dtos.stream()
                .map(this::toProductSummaryProto)
                .collect(Collectors.toList());
    }
}