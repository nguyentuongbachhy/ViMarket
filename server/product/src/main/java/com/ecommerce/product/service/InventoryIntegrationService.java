package com.ecommerce.product.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ecommerce.grpc.inventory.CheckInventoryBatchResponse;
import com.ecommerce.grpc.inventory.CheckInventoryResponse;
import com.ecommerce.grpc.inventory.InventoryStatus;
import com.ecommerce.product.dto.ProductSummaryDTO;
import com.ecommerce.product.grpc.client.InventoryGrpcClient;
import com.ecommerce.product.grpc.client.InventoryGrpcClient.InventoryCheckItemWithInfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class InventoryIntegrationService {

    private final InventoryGrpcClient inventoryGrpcClient;

    /**
     * Check inventory for a single product and update its inventory status
     */
    public ProductSummaryDTO enrichWithInventoryInfo(ProductSummaryDTO product) {
        try {
            String inventoryStatus = product.getInventoryStatus() != null ? product.getInventoryStatus() : "";
            String productName = product.getName() != null ? product.getName() : "";
            double price = product.getPrice() != null ? product.getPrice().doubleValue() : 0.0;

            CheckInventoryResponse response = inventoryGrpcClient.checkInventoryWithProductInfo(
                    product.getId(), 
                    1, // Check for 1 unit
                    inventoryStatus,
                    productName, 
                    price
            );

            // Update inventory status based on response
            if (response.getResultStatus().getCode() == com.ecommerce.grpc.common.Status.Code.OK) {
                product.setInventoryStatus(response.getStatus());
                
                // You might want to add availability info to DTO if needed
                log.debug("Product {} inventory updated: status={}, available={}, quantity={}", 
                        product.getId(), response.getStatus(), response.getAvailable(), response.getAvailableQuantity());
            } else {
                log.warn("Failed to get inventory info for product {}: {}", 
                        product.getId(), response.getResultStatus().getMessage());
            }

            return product;

        } catch (Exception e) {
            log.error("Error enriching product {} with inventory info", product.getId(), e);
            // Don't throw exception, just return original product
            return product;
        }
    }

    /**
     * Check inventory for multiple products and update their inventory status
     */
    public List<ProductSummaryDTO> enrichWithInventoryInfo(List<ProductSummaryDTO> products) {
        if (products == null || products.isEmpty()) {
            return products;
        }

        try {
            // Prepare batch request
            List<InventoryCheckItemWithInfo> inventoryItems = products.stream()
                    .map(product -> new InventoryCheckItemWithInfo(
                            product.getId(),
                            1, // Check for 1 unit
                            product.getInventoryStatus() != null ? product.getInventoryStatus() : "",
                            product.getName() != null ? product.getName() : "",
                            product.getPrice() != null ? product.getPrice().doubleValue() : 0.0
                    ))
                    .collect(Collectors.toList());

            // Call inventory service
            CheckInventoryBatchResponse response = inventoryGrpcClient.checkInventoryBatchWithProductInfo(inventoryItems);

            if (response.getResultStatus().getCode() == com.ecommerce.grpc.common.Status.Code.OK) {
                // Create map for quick lookup
                Map<String, InventoryStatus> inventoryMap = response.getItemsList().stream()
                        .collect(Collectors.toMap(
                                InventoryStatus::getProductId,
                                item -> item
                        ));

                // Update products with inventory info
                products.forEach(product -> {
                    InventoryStatus inventoryStatus = inventoryMap.get(product.getId());
                    if (inventoryStatus != null) {
                        product.setInventoryStatus(inventoryStatus.getStatus());
                        
                        log.debug("Product {} inventory updated: status={}, available={}, quantity={}", 
                                product.getId(), inventoryStatus.getStatus(), 
                                inventoryStatus.getAvailable(), inventoryStatus.getAvailableQuantity());
                    }
                });

                log.info("Successfully enriched {} products with inventory information", products.size());
            } else {
                log.warn("Failed to get batch inventory info: {}", response.getResultStatus().getMessage());
            }

        } catch (Exception e) {
            log.error("Error enriching products with inventory info", e);
            // Don't throw exception, just return original products
        }

        return products;
    }

    /**
     * Check if a product is available for purchase
     */
    public boolean isProductAvailable(String productId, int quantity, 
            String inventoryStatus, String productName, BigDecimal price) {
        try {
            CheckInventoryResponse response = inventoryGrpcClient.checkInventoryWithProductInfo(
                    productId,
                    quantity,
                    inventoryStatus != null ? inventoryStatus : "",
                    productName != null ? productName : "",
                    price != null ? price.doubleValue() : 0.0
            );

            if (response.getResultStatus().getCode() == com.ecommerce.grpc.common.Status.Code.OK) {
                return response.getAvailable();
            } else {
                log.warn("Failed to check availability for product {}: {}", 
                        productId, response.getResultStatus().getMessage());
                return false;
            }

        } catch (Exception e) {
            log.error("Error checking availability for product {}", productId, e);
            return false;
        }
    }

    /**
     * Get available quantity for a product
     */
    public int getAvailableQuantity(String productId, String inventoryStatus, String productName, BigDecimal price) {
        try {
            CheckInventoryResponse response = inventoryGrpcClient.checkInventoryWithProductInfo(
                    productId,
                    1, // Check for 1 unit
                    inventoryStatus != null ? inventoryStatus : "",
                    productName != null ? productName : "",
                    price != null ? price.doubleValue() : 0.0
            );

            if (response.getResultStatus().getCode() == com.ecommerce.grpc.common.Status.Code.OK) {
                return response.getAvailableQuantity();
            } else {
                log.warn("Failed to get available quantity for product {}: {}", 
                        productId, response.getResultStatus().getMessage());
                return 0;
            }

        } catch (Exception e) {
            log.error("Error getting available quantity for product {}", productId, e);
            return 0;
        }
    }
}