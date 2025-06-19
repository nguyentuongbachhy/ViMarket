// CategoryRepository.java - Thêm methods
package com.ecommerce.product.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ecommerce.product.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {

    // Find by parent id (direct children)
    List<Category> findByParentId(String parentId);

    // Find by level
    List<Category> findByLevel(Integer level);

    // Find root categories (where parent_id is null)
    List<Category> findByParentIdIsNull();

    // Find categories with products
    @Query("SELECT DISTINCT c FROM Category c JOIN c.products p")
    List<Category> findWithProducts();

    // Find categories by product id
    @Query("SELECT c FROM Category c JOIN c.products p WHERE p.id = :productId")
    List<Category> findByProductId(@Param("productId") String productId);

    // NEW: Find category hierarchy/path from root to current category
    @Query(value = """
        WITH RECURSIVE category_path AS (
            -- Base case: start with the target category
            SELECT id, name, url, parent_id, level, 0 as depth
            FROM categories 
            WHERE id = :categoryId
            
            UNION ALL
            
            -- Recursive case: find parent categories
            SELECT c.id, c.name, c.url, c.parent_id, c.level, cp.depth + 1
            FROM categories c
            JOIN category_path cp ON c.id = cp.parent_id
        )
        SELECT * FROM category_path 
        ORDER BY depth DESC
        """, nativeQuery = true)
    List<Category> findCategoryPath(@Param("categoryId") String categoryId);

    // NEW: Alternative method using recursive CTE for hierarchy
    @Query(value = """
        WITH RECURSIVE hierarchy AS (
            SELECT id, name, url, parent_id, level, CAST(name AS CHAR(1000)) as path
            FROM categories 
            WHERE id = :categoryId
            
            UNION ALL
            
            SELECT c.id, c.name, c.url, c.parent_id, c.level, 
                   CONCAT(c.name, ' > ', h.path) as path
            FROM categories c
            JOIN hierarchy h ON c.id = h.parent_id
        )
        SELECT id, name, url, parent_id, level FROM hierarchy 
        WHERE parent_id IS NULL
        ORDER BY level
        """, nativeQuery = true)
    List<Category> findRootToCategory(@Param("categoryId") String categoryId);

    // NEW: Count products in category and subcategories
    @Query("""
        SELECT COUNT(DISTINCT p.id) 
        FROM Category c 
        LEFT JOIN c.products p 
        WHERE c.id = :categoryId 
           OR c.parentId = :categoryId
        """)
    Long countProductsInCategoryAndSubcategories(@Param("categoryId") String categoryId);
}