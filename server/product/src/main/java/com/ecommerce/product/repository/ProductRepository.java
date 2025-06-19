package com.ecommerce.product.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import com.ecommerce.product.entity.Brand;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Image;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.entity.Seller;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

        // Tìm sản phẩm theo ID - sử dụng EntityGraph để load tất cả dữ liệu liên quan
        @EntityGraph(value = "Product.detail")
        @NonNull
        Optional<Product> findById(@NonNull String id);

        // Lấy tất cả sản phẩm - chỉ lấy thông tin cơ bản
        @Query("SELECT p FROM Product p")
        @NonNull
        Page<Product> findAll(@NonNull Pageable pageable);

        // Tìm images cho danh sách sản phẩm
        @Query("SELECT i FROM Image i WHERE i.product.id IN :productIds ORDER BY i.position")
        List<Image> findImagesByProductIds(@Param("productIds") List<String> productIds);

        // Tìm brands theo IDs
        @Query("SELECT b FROM Brand b WHERE b.id IN :brandIds")
        List<Brand> findBrandsByIds(@Param("brandIds") List<String> brandIds);

        // ✅ Thêm method để tìm sellers theo IDs
        @Query("SELECT s FROM Seller s WHERE s.id IN :sellerIds")
        List<Seller> findSellersByIds(@Param("sellerIds") List<String> sellerIds);

        // ✅ Thêm method để tìm categories cho các product IDs
        @Query("SELECT c FROM Category c JOIN c.products p WHERE p.id IN :productIds")
        List<Category> findCategoriesByProductIds(@Param("productIds") List<String> productIds);

        // ✅ Thêm method để lấy product-category mapping
        @Query("SELECT p.id as productId, c.id as categoryId, c.name as categoryName, c.url as categoryUrl, c.parentId as parentId, c.level as level " +
               "FROM Product p JOIN p.categories c WHERE p.id IN :productIds")
        List<Object[]> findProductCategoryMappings(@Param("productIds") List<String> productIds);

        // Tìm sản phẩm theo Brand
        @Query("SELECT p FROM Product p WHERE p.brand.id = :brandId")
        Page<Product> findByBrandId(@Param("brandId") String brandId, Pageable pageable);

        // Tìm sản phẩm theo Seller
        @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId")
        Page<Product> findBySellerId(@Param("sellerId") String sellerId, Pageable pageable);

        // Tìm sản phẩm theo Category
        @Query("SELECT p FROM Product p JOIN p.categories c WHERE c.id = :categoryId")
        Page<Product> findByCategoryId(@Param("categoryId") String categoryId, Pageable pageable);

        // Tìm sản phẩm theo khoảng giá
        @Query("SELECT p FROM Product p WHERE p.price BETWEEN :minPrice AND :maxPrice")
        Page<Product> findByPriceBetween(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice,
                        Pageable pageable);

        // Tìm sản phẩm theo danh sách ID
        @Query("SELECT p FROM Product p WHERE p.id IN :ids")
        List<Product> findByIdIn(@Param("ids") List<String> ids);

        // Tìm kiếm sản phẩm theo từ khóa
        @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.shortDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))")
        Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

        // Sản phẩm bán chạy nhất
        @Query("SELECT p FROM Product p WHERE p.allTimeQuantitySold IS NOT NULL ORDER BY p.allTimeQuantitySold DESC NULLS LAST")
        Page<Product> findTopSellingProducts(Pageable pageable);

        // Sản phẩm đánh giá cao nhất
        @Query("SELECT p FROM Product p WHERE p.ratingAverage IS NOT NULL ORDER BY p.ratingAverage DESC NULLS LAST")
        Page<Product> findTopRatedProducts(Pageable pageable);

        // Sản phẩm mới nhất
        @Query("SELECT p FROM Product p ORDER BY p.createdAt DESC")
        Page<Product> findNewArrivals(Pageable pageable);
}