package com.ecommerce.product.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.grpc.inventory.CheckInventoryBatchResponse;
import com.ecommerce.grpc.inventory.CheckInventoryResponse;
import com.ecommerce.grpc.inventory.InventoryStatus;
import com.ecommerce.product.dto.BrandDTO;
import com.ecommerce.product.dto.CategoryDTO;
import com.ecommerce.product.dto.ImageDTO;
import com.ecommerce.product.dto.PagedResponseDTO;
import com.ecommerce.product.dto.ProductDetailDTO;
import com.ecommerce.product.dto.ProductFilterDTO;
import com.ecommerce.product.dto.ProductSummaryDTO;
import com.ecommerce.product.dto.SellerDTO;
import com.ecommerce.product.entity.Brand;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Image;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.entity.Seller;
import com.ecommerce.product.exception.ResourceNotFoundException;
import com.ecommerce.product.grpc.client.InventoryGrpcClient;
import com.ecommerce.product.mapper.ProductMapper;
import com.ecommerce.product.repository.ProductRepository;
import com.ecommerce.product.service.ProductService;
import com.ecommerce.product.specification.ProductSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final InventoryGrpcClient inventoryGrpcClient;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "productById", key = "#id", unless = "#result == null")
    public ProductDetailDTO getProductById(String id) {
        log.debug("Getting product by id: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        ProductDetailDTO productDetail = productMapper.toProductDetailDTO(product);
        
        // Check inventory status with better error handling
        try {
            CheckInventoryResponse inventoryResponse = inventoryGrpcClient.checkInventory(id, 1);
            if (inventoryResponse.getResultStatus().getCode() == com.ecommerce.grpc.common.Status.Code.OK) {
                String currentStatus = productDetail.getInventoryStatus();
                String inventoryStatus = inventoryResponse.getStatus();
                
                if (!inventoryStatus.equals(currentStatus)) {
                    log.debug("Updating inventory status for product {}: {} -> {}", 
                            id, currentStatus, inventoryStatus);
                    productDetail.setInventoryStatus(inventoryStatus);
                }
            } else {
                log.warn("Inventory service returned error for product {}: {}", 
                        id, inventoryResponse.getResultStatus().getMessage());
            }
        } catch (Exception e) {
            log.warn("Failed to check inventory for product {}: {}. Using product's current status.", 
                    id, e.getMessage());
        }

        return productDetail;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "allProducts", key = "{#page, #size, #sortBy, #direction}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getAllProducts(int page, int size, String sortBy, String direction) {
        log.debug("Getting all products with page: {}, size: {}, sortBy: {}, direction: {}", page, size, sortBy,
                direction);

        Sort sort = createSort(sortBy, direction);
        Pageable pageable = PageRequest.of(page, size, sort);

        try {
            // 1. Lấy danh sách sản phẩm với phân trang (không load relationships)
            Page<Product> productPage = productRepository.findAll(pageable);
            List<Product> products = productPage.getContent();

            if (products.isEmpty()) {
                return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
            }

            // 2. Lấy product IDs, brand IDs, seller IDs
            List<String> productIds = getProductIds(products);
            List<String> brandIds = getBrandIds(products);
            List<String> sellerIds = getSellerIds(products);

            // 3. Lấy thông tin liên quan theo batch
            List<Image> allImages = productRepository.findImagesByProductIds(productIds);
            List<Brand> allBrands = getBrands(brandIds);
            List<Seller> allSellers = getSellers(sellerIds);
            List<Category> allCategories = loadCategoriesForProducts(productIds);

            // 4. Tạo maps để tìm kiếm nhanh
            Map<String, List<Image>> imagesByProductId = groupImagesByProductId(allImages);
            Map<String, Brand> brandsById = mapBrandsById(allBrands);
            Map<String, Seller> sellersById = mapSellersById(allSellers);
            Map<String, List<CategoryDTO>> categoriesByProductId = groupCategoriesByProductId(productIds, allCategories);

            // 5. Chuyển đổi sang DTOs
            List<ProductSummaryDTO> productDTOs = products.stream()
                    .map(product -> convertToProductSummaryDTO(product, imagesByProductId, brandsById, sellersById, categoriesByProductId))
                    .collect(Collectors.toList());

            return productMapper.toPagedResponseDTO(productPage, productDTOs);
        } catch (Exception e) {
            log.error("Error getting all products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummaryDTO> getProductsByIds(List<String> ids) {
        log.debug("Getting products by ids: {}", ids);
        
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            // 1. Lấy danh sách sản phẩm theo IDs
            List<Product> products = productRepository.findByIdIn(ids);
            
            if (products.isEmpty()) {
                return new ArrayList<>();
            }

            // 2. Lấy product IDs, brand IDs, seller IDs
            List<String> productIds = getProductIds(products);
            List<String> brandIds = getBrandIds(products);
            List<String> sellerIds = getSellerIds(products);

            // 3. Lấy thông tin liên quan theo batch
            List<Image> allImages = productRepository.findImagesByProductIds(productIds);
            List<Brand> allBrands = getBrands(brandIds);
            List<Seller> allSellers = getSellers(sellerIds);
            List<Category> allCategories = loadCategoriesForProducts(productIds);

            // 4. Tạo maps để tìm kiếm nhanh
            Map<String, List<Image>> imagesByProductId = groupImagesByProductId(allImages);
            Map<String, Brand> brandsById = mapBrandsById(allBrands);
            Map<String, Seller> sellersById = mapSellersById(allSellers);
            Map<String, List<CategoryDTO>> categoriesByProductId = groupCategoriesByProductId(productIds, allCategories);

            // 5. Chuyển đổi sang DTOs
            List<ProductSummaryDTO> productDTOs = products.stream()
                    .map(product -> convertToProductSummaryDTO(product, imagesByProductId, brandsById, sellersById, categoriesByProductId))
                    .collect(Collectors.toList());

            // 6. Batch check inventory for all products
            try {
                List<InventoryGrpcClient.InventoryCheckItem> inventoryItems = productDTOs.stream()
                        .map(p -> new InventoryGrpcClient.InventoryCheckItem(p.getId(), 1))
                        .toList();

                CheckInventoryBatchResponse inventoryResponse = inventoryGrpcClient.checkInventoryBatch(inventoryItems);
                
                if (inventoryResponse.getResultStatus().getCode() == com.ecommerce.grpc.common.Status.Code.OK) {
                    // Update inventory status for each product
                    Map<String, String> inventoryStatusMap = inventoryResponse.getItemsList().stream()
                            .collect(Collectors.toMap(
                                    InventoryStatus::getProductId,
                                    InventoryStatus::getStatus
                            ));

                    productDTOs.forEach(product -> {
                        String inventoryStatus = inventoryStatusMap.get(product.getId());
                        if (inventoryStatus != null && !inventoryStatus.equals(product.getInventoryStatus())) {
                            log.debug("Updating inventory status for product {}: {} -> {}", 
                                    product.getId(), product.getInventoryStatus(), inventoryStatus);
                            product.setInventoryStatus(inventoryStatus);
                        }
                    });
                }
            } catch (Exception e) {
                log.warn("Failed to batch check inventory for {} products: {}", productDTOs.size(), e.getMessage());
                // Continue without inventory check
            }

            return productDTOs;
            
        } catch (Exception e) {
            log.error("Error getting products by ids: {}", ids, e);
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "productsByCategory", key = "{#categoryId, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getProductsByCategory(String categoryId, int page, int size) {
        log.debug("Getting products for category id: {}", categoryId);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting products by category: {}", categoryId, e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "productsByBrand", key = "{#brandId, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getProductsByBrand(String brandId, int page, int size) {
        log.debug("Getting products for brand id: {}", brandId);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.findByBrandId(brandId, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting products by brand: {}", brandId, e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Cacheable(value = "productsByPriceRange", key = "{#minPrice, #maxPrice, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice,
            int page, int size) {
        log.debug("Getting products for price range: {} - {}", minPrice, maxPrice);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.findByPriceBetween(minPrice, maxPrice, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting products by price range", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    public PagedResponseDTO<ProductSummaryDTO> searchProducts(String keyword, int page, int size) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }

        log.debug("Searching products with keyword: {}", keyword);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.searchByKeyword(keyword.trim(), pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error searching products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Cacheable(value = "topSellingProducts", key = "{#page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getTopSellingProducts(int page, int size) {
        log.debug("Getting top selling products");

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.findTopSellingProducts(pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting top selling products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Cacheable(value = "topRatedProducts", key = "{#page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getTopRatedProducts(int page, int size) {
        log.debug("Getting top rated products");

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.findTopRatedProducts(pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting top rated products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Cacheable(value = "newArrivals", key = "{#page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getNewArrivals(int page, int size) {
        log.debug("Getting new arrivals");

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = productRepository.findNewArrivals(pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting new arrivals", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    // ✅ Helper methods - Updated and properly implemented

    private PagedResponseDTO<ProductSummaryDTO> convertToPagedResponse(Page<Product> productPage, int page, int size) {
        List<Product> products = productPage.getContent();

        if (products.isEmpty()) {
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }

        // Lấy product IDs, brand IDs, seller IDs
        List<String> productIds = getProductIds(products);
        List<String> brandIds = getBrandIds(products);
        List<String> sellerIds = getSellerIds(products);

        // Lấy thông tin liên quan theo batch
        List<Image> allImages = productRepository.findImagesByProductIds(productIds);
        List<Brand> allBrands = getBrands(brandIds);
        List<Seller> allSellers = getSellers(sellerIds);
        List<Category> allCategories = loadCategoriesForProducts(productIds);

        // Tạo maps để tìm kiếm nhanh
        Map<String, List<Image>> imagesByProductId = groupImagesByProductId(allImages);
        Map<String, Brand> brandsById = mapBrandsById(allBrands);
        Map<String, Seller> sellersById = mapSellersById(allSellers);
        Map<String, List<CategoryDTO>> categoriesByProductId = groupCategoriesByProductId(productIds, allCategories);

        // Chuyển đổi sang DTOs
        List<ProductSummaryDTO> productDTOs = products.stream()
                .map(product -> convertToProductSummaryDTO(product, imagesByProductId, brandsById, sellersById, categoriesByProductId))
                .collect(Collectors.toList());

        return productMapper.toPagedResponseDTO(productPage, productDTOs);
    }

    private List<String> getProductIds(List<Product> products) {
        return products.stream()
                .map(Product::getId)
                .collect(Collectors.toList());
    }

    private List<String> getBrandIds(List<Product> products) {
        return products.stream()
                .filter(p -> p.getBrand() != null)
                .map(p -> p.getBrand().getId())
                .distinct()
                .collect(Collectors.toList());
    }

    private List<String> getSellerIds(List<Product> products) {
        return products.stream()
                .filter(p -> p.getSeller() != null)
                .map(p -> p.getSeller().getId())
                .distinct()
                .collect(Collectors.toList());
    }

    private List<Brand> getBrands(List<String> brandIds) {
        if (brandIds.isEmpty()) {
            return Collections.emptyList();
        }
        return productRepository.findBrandsByIds(brandIds);
    }

    private List<Seller> getSellers(List<String> sellerIds) {
        if (sellerIds.isEmpty()) {
            return Collections.emptyList();
        }
        return productRepository.findSellersByIds(sellerIds);
    }

    // ✅ Properly implemented categories loading
    private List<Category> loadCategoriesForProducts(List<String> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyList();
        }
        return productRepository.findCategoriesByProductIds(productIds);
    }

    private Map<String, List<Image>> groupImagesByProductId(List<Image> images) {
        Map<String, List<Image>> imagesByProductId = new HashMap<>();
        for (Image image : images) {
            String productId = image.getProduct().getId();
            imagesByProductId.computeIfAbsent(productId, k -> new ArrayList<>()).add(image);
        }
        return imagesByProductId;
    }

    private Map<String, Brand> mapBrandsById(List<Brand> brands) {
        return brands.stream()
                .collect(Collectors.toMap(Brand::getId, brand -> brand));
    }

    private Map<String, Seller> mapSellersById(List<Seller> sellers) {
        return sellers.stream()
                .collect(Collectors.toMap(Seller::getId, seller -> seller));
    }

    // ✅ Properly implemented categories grouping
    private Map<String, List<CategoryDTO>> groupCategoriesByProductId(List<String> productIds, List<Category> categories) {
        Map<String, List<CategoryDTO>> categoriesByProductId = new HashMap<>();
        
        try {
            // Lấy product-category mappings
            List<Object[]> mappings = productRepository.findProductCategoryMappings(productIds);
            
            for (Object[] mapping : mappings) {
                String productId = (String) mapping[0];
                String categoryId = (String) mapping[1];
                String categoryName = (String) mapping[2];
                String categoryUrl = (String) mapping[3];
                String parentId = (String) mapping[4];
                Integer level = (Integer) mapping[5];
                
                CategoryDTO categoryDTO = CategoryDTO.builder()
                        .id(categoryId)
                        .name(categoryName)
                        .url(categoryUrl)
                        .parentId(parentId)
                        .level(level)
                        .build();
                
                categoriesByProductId.computeIfAbsent(productId, k -> new ArrayList<>()).add(categoryDTO);
            }
        } catch (Exception e) {
            log.error("Error grouping categories by product ID", e);
        }
        
        return categoriesByProductId;
    }

    // ✅ Updated conversion method to include seller and categories
    private ProductSummaryDTO convertToProductSummaryDTO(Product product,
            Map<String, List<Image>> imagesByProductId,
            Map<String, Brand> brandsById,
            Map<String, Seller> sellersById,
            Map<String, List<CategoryDTO>> categoriesByProductId) {
        
        ProductSummaryDTO dto = new ProductSummaryDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setShortDescription(product.getShortDescription());
        dto.setPrice(product.getPrice());
        dto.setOriginalPrice(product.getOriginalPrice());
        dto.setRatingAverage(product.getRatingAverage());
        dto.setReviewCount(product.getReviewCount());
        dto.setInventoryStatus(product.getInventoryStatus());
        dto.setQuantitySold(product.getQuantitySold());

        // Set brand
        if (product.getBrand() != null && brandsById.containsKey(product.getBrand().getId())) {
            Brand brand = brandsById.get(product.getBrand().getId());
            BrandDTO brandDTO = productMapper.toBrandDTO(brand);
            dto.setBrand(brandDTO);
        }

        // ✅ Set seller
        if (product.getSeller() != null && sellersById.containsKey(product.getSeller().getId())) {
            Seller seller = sellersById.get(product.getSeller().getId());
            SellerDTO sellerDTO = productMapper.toSellerDTO(seller);
            dto.setSeller(sellerDTO);
        }

        // Set images (tối đa 3 ảnh)
        if (imagesByProductId.containsKey(product.getId())) {
            List<Image> productImages = imagesByProductId.get(product.getId());
            List<ImageDTO> imageDTOs = productImages.stream()
                    .sorted((i1, i2) -> {
                        if (i1.getPosition() == null) return 1;
                        if (i2.getPosition() == null) return -1;
                        return i1.getPosition().compareTo(i2.getPosition());
                    })
                    .limit(3)
                    .map(productMapper::toImageDTO)
                    .collect(Collectors.toList());
            dto.setImages(imageDTOs);
        } else {
            dto.setImages(Collections.emptyList());
        }

        // ✅ Set categories
        if (categoriesByProductId.containsKey(product.getId())) {
            dto.setCategories(categoriesByProductId.get(product.getId()));
        } else {
            dto.setCategories(Collections.emptyList());
        }

        return dto;
    }

    private Sort createSort(String sortBy, String direction) {
        if (sortBy == null || sortBy.isEmpty()) {
            sortBy = "id"; // Default sort field
        }

        Sort.Direction sortDirection = Sort.Direction.ASC;
        if (direction != null && direction.equalsIgnoreCase("desc")) {
            sortDirection = Sort.Direction.DESC;
        }

        return Sort.by(sortDirection, sortBy);
    }

    // Phương thức để xóa cache
    @Caching(evict = {
            @CacheEvict(value = "productById", key = "#id"),
            @CacheEvict(value = "allProducts", allEntries = true),
            @CacheEvict(value = "productsByCategory", allEntries = true),
            @CacheEvict(value = "productsByBrand", allEntries = true),
            @CacheEvict(value = "topSellingProducts", allEntries = true),
            @CacheEvict(value = "topRatedProducts", allEntries = true),
            @CacheEvict(value = "newArrivals", allEntries = true)
    })
    public void evictCachesForProduct(String id) {
        log.debug("Evicting caches for product with id: {}", id);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "productById", key = "#productId"),
        @CacheEvict(value = "topSellingProducts", allEntries = true),
        @CacheEvict(value = "allProducts", allEntries = true)
    })
    public void updateProductSalesStats(String productId, int quantitySold) {
        log.debug("Updating sales stats for product: {} with quantity: {}", productId, quantitySold);
        
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
            
            int currentQuantitySold = product.getQuantitySold() != null ? product.getQuantitySold() : 0;
            int currentAllTimeQuantitySold = product.getAllTimeQuantitySold() != null ? 
                    product.getAllTimeQuantitySold() : 0;
            
            product.setQuantitySold(currentQuantitySold + quantitySold);
            product.setAllTimeQuantitySold(currentAllTimeQuantitySold + quantitySold);
            product.setUpdatedAt(LocalDateTime.now());
            
            productRepository.save(product);
            
            log.info("Updated sales stats for product {}: +{} (total: {})", 
                    productId, quantitySold, product.getAllTimeQuantitySold());
                    
        } catch (Exception e) {
            log.error("Failed to update sales stats for product: {}", productId, e);
            throw new RuntimeException("Failed to update product sales stats", e);
        }
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "productById", key = "#productId"),
        @CacheEvict(value = "topRatedProducts", allEntries = true),
        @CacheEvict(value = "allProducts", allEntries = true)
    })
    public void updateProductRating(String productId, BigDecimal newRating, int reviewCount) {
        log.debug("Updating rating for product: {} to rating: {}, reviews: {}", 
                productId, newRating, reviewCount);
        
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
            
            product.setRatingAverage(newRating);
            product.setReviewCount(reviewCount);
            product.setUpdatedAt(LocalDateTime.now());
            
            productRepository.save(product);
            
            log.info("Updated rating for product {}: {} ({} reviews)", 
                    productId, newRating, reviewCount);
                    
        } catch (Exception e) {
            log.error("Failed to update rating for product: {}", productId, e);
            throw new RuntimeException("Failed to update product rating", e);
        }
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "productById", key = "#productId"),
        @CacheEvict(value = "allProducts", allEntries = true)
    })
    public void updateInventoryStatus(String productId, String status) {
        log.debug("Updating inventory status for product: {} to: {}", productId, status);
        
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
            
            String oldStatus = product.getInventoryStatus();
            if (!status.equals(oldStatus)) {
                product.setInventoryStatus(status);
                product.setUpdatedAt(LocalDateTime.now());
                
                productRepository.save(product);
                
                log.info("Updated inventory status for product {}: {} -> {}", 
                        productId, oldStatus, status);
            }
                    
        } catch (Exception e) {
            log.error("Failed to update inventory status for product: {}", productId, e);
            throw new RuntimeException("Failed to update product inventory status", e);
        }
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "productById", key = "#productId"),
        @CacheEvict(value = "allProducts", allEntries = true),
        @CacheEvict(value = "productsByCategory", allEntries = true),
        @CacheEvict(value = "productsByBrand", allEntries = true),
        @CacheEvict(value = "topSellingProducts", allEntries = true),
        @CacheEvict(value = "topRatedProducts", allEntries = true),
        @CacheEvict(value = "newArrivals", allEntries = true)
    })
    public void clearProductCaches(String productId) {
        log.debug("Clearing caches for product: {}", productId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "filteredProducts", key = "{#filter.cacheKey, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getAllProductsWithFilters(ProductFilterDTO filter, int page, int size) {
        log.debug("Getting all products with filters: {}", filter);
        
        try {
            Specification<Product> spec = ProductSpecification.withFilters(filter);
            Sort sort = createSort(filter.getSortBy(), filter.getDirection());
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Product> productPage = productRepository.findAll(spec, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting filtered products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "searchResults", key = "{#filter.cacheKey, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> searchProductsWithFilters(ProductFilterDTO filter, int page, int size) {
        log.debug("Searching products with filters: {}", filter);
        
        if (filter.getQ() == null || filter.getQ().trim().isEmpty()) {
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
        
        try {
            Specification<Product> spec = ProductSpecification.withFilters(filter);
            Sort sort = createSort(filter.getSortBy(), filter.getDirection());
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Product> productPage = productRepository.findAll(spec, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error searching filtered products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "topSellingFiltered", key = "{#filter.cacheKey, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getTopSellingProductsWithFilters(ProductFilterDTO filter, int page, int size) {
        log.debug("Getting top selling products with filters: {}", filter);
        
        try {
            Specification<Product> spec = Specification.where(ProductSpecification.isTopSelling())
                    .and(ProductSpecification.withFilters(filter));
            
            Sort sort = Sort.by(Sort.Direction.DESC, "allTimeQuantitySold");
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Product> productPage = productRepository.findAll(spec, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting filtered top selling products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "topRatedFiltered", key = "{#filter.cacheKey, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getTopRatedProductsWithFilters(ProductFilterDTO filter, int page, int size) {
        log.debug("Getting top rated products with filters: {}", filter);
        
        try {
            Specification<Product> spec = Specification.where(ProductSpecification.isTopRated())
                    .and(ProductSpecification.withFilters(filter));
            
            Sort sort = Sort.by(Sort.Direction.DESC, "ratingAverage");
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Product> productPage = productRepository.findAll(spec, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting filtered top rated products", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "newArrivalsFiltered", key = "{#filter.cacheKey, #page, #size}", unless = "#result.content.isEmpty()")
    public PagedResponseDTO<ProductSummaryDTO> getNewArrivalsWithFilters(ProductFilterDTO filter, int page, int size) {
        log.debug("Getting new arrivals with filters: {}", filter);
        
        try {
            Specification<Product> spec = Specification.where(ProductSpecification.isNewArrival())
                    .and(ProductSpecification.withFilters(filter));
            
            Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Product> productPage = productRepository.findAll(spec, pageable);
            
            return convertToPagedResponse(productPage, page, size);
        } catch (Exception e) {
            log.error("Error getting filtered new arrivals", e);
            return new PagedResponseDTO<>(Collections.emptyList(), page, size, 0, 0, true);
        }
    }
}