package com.ecommerce.product.specification;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.ecommerce.product.dto.ProductFilterDTO;
import com.ecommerce.product.entity.Product;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

public class ProductSpecification {

    public static Specification<Product> withFilters(ProductFilterDTO filter) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

            // Search by keyword (name or description)
            if (filter.getQ() != null && !filter.getQ().trim().isEmpty()) {
                String keyword = "%" + filter.getQ().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("name")), keyword);
                Predicate descPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("shortDescription")), keyword);
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.or(namePredicate, descPredicate));
            }

            // Filter by price range
            if (filter.getMinPrice() != null) {
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }

            // Filter by rating range
            if (filter.getMinRating() != null) {
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.greaterThanOrEqualTo(root.get("ratingAverage"), filter.getMinRating()));
            }
            if (filter.getMaxRating() != null) {
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.lessThanOrEqualTo(root.get("ratingAverage"), filter.getMaxRating()));
            }

            // Filter by brand IDs
            if (filter.getBrandIds() != null && !filter.getBrandIds().isEmpty()) {
                Join<Object, Object> brandJoin = root.join("brand", JoinType.LEFT);
                predicate = criteriaBuilder.and(predicate,
                    brandJoin.get("id").in(filter.getBrandIds()));
            }

            // Filter by brand names
            if (filter.getBrandNames() != null && !filter.getBrandNames().isEmpty()) {
                Join<Object, Object> brandJoin = root.join("brand", JoinType.LEFT);
                // Convert brand names to lowercase for case-insensitive search
                List<String> lowerCaseBrandNames = filter.getBrandNames().stream()
                    .map(String::toLowerCase)
                    .toList();
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.lower(brandJoin.get("name")).in(lowerCaseBrandNames));
            }

            // Filter by category IDs
            if (filter.getCategoryIds() != null && !filter.getCategoryIds().isEmpty()) {
                Join<Object, Object> categoryJoin = root.join("categories", JoinType.LEFT);
                predicate = criteriaBuilder.and(predicate,
                    categoryJoin.get("id").in(filter.getCategoryIds()));
            }

            // Filter by inventory status
            if (filter.getInventoryStatus() != null && !filter.getInventoryStatus().trim().isEmpty()) {
                predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.equal(root.get("inventoryStatus"), filter.getInventoryStatus()));
            }

            // Remove duplicates when joining with categories
            if (filter.getCategoryIds() != null && !filter.getCategoryIds().isEmpty()) {
                query.distinct(true);
            }

            return predicate;
        };
    }

    // Specific specifications for different product types
    public static Specification<Product> isTopSelling() {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.isNotNull(root.get("allTimeQuantitySold"));
    }

    public static Specification<Product> isTopRated() {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.isNotNull(root.get("ratingAverage"));
    }

    public static Specification<Product> isNewArrival() {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.isNotNull(root.get("createdAt"));
    }
}