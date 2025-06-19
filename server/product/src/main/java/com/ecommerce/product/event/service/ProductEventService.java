package com.ecommerce.product.event.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.product.event.model.InventoryStatusUpdateEvent;
import com.ecommerce.product.event.model.ProductRatingUpdateEvent;
import com.ecommerce.product.event.model.ProductSalesUpdateEvent;
import com.ecommerce.product.service.ProductService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEventService {

    private final ProductService productService;

    /**
     * Handle sales statistics update from Order Service
     */
    @Transactional
    public void handleProductSalesUpdate(ProductSalesUpdateEvent event) {
        log.info("Processing sales update for {} products from order: {}", 
                event.getItems().size(), event.getOrderId());
        
        for (ProductSalesUpdateEvent.SalesItem item : event.getItems()) {
            try {
                productService.updateProductSalesStats(item.getProductId(), item.getQuantity());
                log.debug("Updated sales stats for product {}: +{}", 
                        item.getProductId(), item.getQuantity());
            } catch (Exception e) {
                log.error("Failed to update sales stats for product: {}", 
                        item.getProductId(), e);
                // Continue processing other items
            }
        }
    }

    /**
     * Handle inventory status update from Inventory Service  
     */
    @Transactional
    public void handleInventoryStatusUpdate(InventoryStatusUpdateEvent event) {
        log.info("Processing inventory status update for product: {} -> {}", 
                event.getProductId(), event.getNewStatus());
        
        try {
            productService.updateInventoryStatus(event.getProductId(), event.getNewStatus());
            log.info("Updated inventory status for product {}: {}", 
                    event.getProductId(), event.getNewStatus());
        } catch (Exception e) {
            log.error("Failed to update inventory status for product: {}", 
                    event.getProductId(), e);
        }
    }

    /**
     * Handle rating update from Review Service
     */
    @Transactional  
    public void handleRatingUpdate(ProductRatingUpdateEvent event) {
        log.info("Processing rating update for product: {} -> {}", 
                event.getProductId(), event.getNewRating());
        
        try {
            productService.updateProductRating(
                    event.getProductId(), 
                    event.getNewRating(), 
                    event.getReviewCount());
            log.info("Updated rating for product {}: {}", 
                    event.getProductId(), event.getNewRating());
        } catch (Exception e) {
            log.error("Failed to update rating for product: {}", 
                    event.getProductId(), e);
        }
    }
}