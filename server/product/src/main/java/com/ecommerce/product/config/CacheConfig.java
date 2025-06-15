package com.ecommerce.product.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .maximumSize(500)
                .recordStats());

        cacheManager.setCacheNames(java.util.Arrays.asList(
                "productById",
                "productsByCategory",
                "productsByBrand",
                "topSellingProducts",
                "topRatedProducts",
                "newArrivals",
                "reviewsByProduct",
                "allProducts",
                        "filteredProducts",
                "searchResults",
                "topSellingFiltered",
                "topRatedFiltered",
                "newArrivalsFiltered"
            ));

        return cacheManager;
    }

    @Bean
    public Caffeine<Object, Object> productByIdCaffeine() {
        return Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .initialCapacity(100)
                .maximumSize(1000);
    }

    @Bean
    public Caffeine<Object, Object> productsByCategoryCaffeine() {
        return Caffeine.newBuilder()
                .expireAfterWrite(15, TimeUnit.MINUTES)
                .initialCapacity(50)
                .maximumSize(200);
    }
}