package com.ecommerce.product.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.product.dto.ApiResponseDTO;
import com.github.benmanes.caffeine.cache.stats.CacheStats;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/cache")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cache Admin API", description = "Endpoints for cache management")
public class CacheAdminController {

    private final CacheManager cacheManager;
    
    @GetMapping("/stats")
    @Operation(summary = "Get cache statistics", description = "Returns statistics for all caches")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponseDTO<Map<String, Object>> getCacheStatistics() {
        log.debug("Getting cache statistics");

        Map<String, Object> stats = new HashMap<>();
        cacheManager.getCacheNames().forEach(cacheName -> {
            CaffeineCache caffeineCache = (CaffeineCache) cacheManager.getCache(cacheName);
            if (caffeineCache != null) {
                com.github.benmanes.caffeine.cache.Cache<Object, Object> nativeCache = caffeineCache.getNativeCache();

                if (nativeCache.stats() != null) {
                    CacheStats cacheStats = nativeCache.stats();
                    Map<String, Object> cacheInfo = new HashMap<>();
                    cacheInfo.put("size", nativeCache.estimatedSize());
                    cacheInfo.put("hitCount", cacheStats.hitCount());
                    cacheInfo.put("missCount", cacheStats.missCount());
                    cacheInfo.put("hitRate", cacheStats.hitRate());
                    cacheInfo.put("missRate", cacheStats.missRate());
                    cacheInfo.put("evictionCount", cacheStats.evictionCount());

                    stats.put(cacheName, cacheInfo);
                }
            }
        });

        return ApiResponseDTO.success(stats, "Cache statistics retrieved successfully");
    }

    @GetMapping("/clear/{cacheName}")
    @Operation(summary = "Clear specific cache", description = "Clears a specific cache by name")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponseDTO<Map<String, String>> clearCache(
            @Parameter(description = "Cache name", required = true) @PathVariable String cacheName) {
        log.debug("Clearing cache: {}", cacheName);

        Map<String, String> result = new HashMap<>();
        Cache cachedName = cacheManager.getCache(cacheName);

        if (cachedName != null) {
            cachedName.clear();
            result.put("message", "Cache '" + cacheName + "' cleared successfully");
        } else {
            result.put("message", "Cache '" + cacheName + "' not found");
        }

        return ApiResponseDTO.success(result);
    }

    @GetMapping("/clear/all")
    @Operation(summary = "Clear all caches", description = "Clears all caches")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponseDTO<Map<String, String>> clearAllCaches() {
        log.debug("Clearing all caches");

        cacheManager.getCacheNames().forEach(cacheName -> {
            Cache cachedName = cacheManager.getCache(cacheName);

            if (cachedName != null) {
                cachedName.clear();
            }
        });

        Map<String, String> result = new HashMap<>();
        result.put("message", "All caches cleared successfully");
        return ApiResponseDTO.success(result);
    }

}