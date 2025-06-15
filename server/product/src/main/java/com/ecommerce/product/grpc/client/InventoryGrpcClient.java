package com.ecommerce.product.grpc.client;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ecommerce.grpc.common.Metadata;
import com.ecommerce.grpc.inventory.CheckInventoryBatchRequest;
import com.ecommerce.grpc.inventory.CheckInventoryBatchResponse;
import com.ecommerce.grpc.inventory.CheckInventoryRequest;
import com.ecommerce.grpc.inventory.CheckInventoryResponse;
import com.ecommerce.grpc.inventory.InventoryItem;
import com.ecommerce.grpc.inventory.InventoryServiceGrpc;
import com.ecommerce.grpc.inventory.ProductInfo;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class InventoryGrpcClient {

    @Value("${grpc.client.inventory.host:localhost}")
    private String inventoryHost;

    @Value("${grpc.client.inventory.port:50054}")
    private int inventoryPort;

    private ManagedChannel channel;
    private InventoryServiceGrpc.InventoryServiceBlockingStub blockingStub;

    @PostConstruct
    public void init() {
        try {
            channel = ManagedChannelBuilder.forAddress(inventoryHost, inventoryPort)
                    .usePlaintext()
                    .keepAliveTime(30, TimeUnit.SECONDS)
                    .keepAliveTimeout(5, TimeUnit.SECONDS)
                    .keepAliveWithoutCalls(true)
                    .maxInboundMessageSize(4 * 1024 * 1024)
                    .build();
            
            blockingStub = InventoryServiceGrpc.newBlockingStub(channel);
            
            log.info("Inventory gRPC client initialized: {}:{}", inventoryHost, inventoryPort);
            
            // Test connection (without product info for test)
            testConnection();
            
        } catch (Exception e) {
            log.error("Failed to initialize gRPC client", e);
        }
    }

    private void testConnection() {
        try {
            CheckInventoryRequest testRequest = CheckInventoryRequest.newBuilder()
                    .setProductId("test-connection")
                    .setQuantity(1)
                    .setMetadata(Metadata.newBuilder()
                            .putData("source", "product-service-test")
                            .putData("timestamp", String.valueOf(System.currentTimeMillis()))
                            .build())
                    .build();
            
            InventoryServiceGrpc.InventoryServiceBlockingStub stub = blockingStub
                    .withDeadlineAfter(5, TimeUnit.SECONDS);
            
            stub.checkInventory(testRequest);
            log.info("gRPC connection test successful");
        } catch (Exception e) {
            log.warn("gRPC connection test failed: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void destroy() {
        if (channel != null && !channel.isShutdown()) {
            try {
                channel.shutdown();
                if (!channel.awaitTermination(5, TimeUnit.SECONDS)) {
                    channel.shutdownNow();
                }
                log.info("gRPC client shutdown completed");
            } catch (InterruptedException e) {
                channel.shutdownNow();
                Thread.currentThread().interrupt();
                log.warn("gRPC client shutdown interrupted");
            }
        }
    }

    /**
     * Check inventory for a single product with product information
     */
    public CheckInventoryResponse checkInventoryWithProductInfo(String productId, int quantity, 
            String inventoryStatus, String productName, double price) {
        try {
            ProductInfo.Builder productInfoBuilder = ProductInfo.newBuilder()
                    .setInventoryStatus(inventoryStatus != null ? inventoryStatus : "")
                    .setName(productName != null ? productName : "")
                    .setPrice(price);

            CheckInventoryRequest request = CheckInventoryRequest.newBuilder()
                    .setProductId(productId)
                    .setQuantity(quantity)
                    .setProductInfo(productInfoBuilder.build())
                    .setMetadata(Metadata.newBuilder()
                            .putData("source", "product-service")
                            .putData("timestamp", String.valueOf(System.currentTimeMillis()))
                            .putData("operation", "check_inventory_with_product_info")
                            .build())
                    .build();

            InventoryServiceGrpc.InventoryServiceBlockingStub stub = blockingStub
                    .withDeadlineAfter(10, TimeUnit.SECONDS);

            CheckInventoryResponse response = stub.checkInventory(request);
            
            log.debug("Inventory check completed for product: {} - available: {}, quantity: {}", 
                    productId, response.getAvailable(), response.getAvailableQuantity());
            
            return response;
            
        } catch (StatusRuntimeException e) {
            log.error("gRPC call failed for checkInventoryWithProductInfo: productId={}, status={}", 
                    productId, e.getStatus());
            throw new RuntimeException("Failed to check inventory for product: " + productId, e);
        } catch (Exception e) {
            log.error("Unexpected error in checkInventoryWithProductInfo: productId={}", productId, e);
            throw new RuntimeException("Failed to check inventory for product: " + productId, e);
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    public CheckInventoryResponse checkInventory(String productId, int quantity) {
        return checkInventoryWithProductInfo(productId, quantity, "", "", 0.0);
    }

    /**
     * Check inventory batch with product information
     */
    public CheckInventoryBatchResponse checkInventoryBatchWithProductInfo(List<InventoryCheckItemWithInfo> items) {
        try {
            List<InventoryItem> grpcItems = items.stream()
                    .map(item -> InventoryItem.newBuilder()
                            .setProductId(item.getProductId())
                            .setQuantity(item.getQuantity())
                            .build())
                    .toList();

            CheckInventoryBatchRequest request = CheckInventoryBatchRequest.newBuilder()
                    .addAllItems(grpcItems)
                    .setMetadata(Metadata.newBuilder()
                            .putData("source", "product-service")
                            .putData("timestamp", String.valueOf(System.currentTimeMillis()))
                            .putData("operation", "check_inventory_batch")
                            .putData("item_count", String.valueOf(items.size()))
                            .build())
                    .build();

            InventoryServiceGrpc.InventoryServiceBlockingStub stub = blockingStub
                    .withDeadlineAfter(15, TimeUnit.SECONDS);

            CheckInventoryBatchResponse response = stub.checkInventoryBatch(request);
            
            log.info("Inventory batch check completed: {} items processed", response.getItemsCount());
            
            return response;
            
        } catch (StatusRuntimeException e) {
            log.error("gRPC call failed for checkInventoryBatchWithProductInfo: itemsCount={}, status={}", 
                    items.size(), e.getStatus());
            throw new RuntimeException("Failed to check inventory batch", e);
        } catch (Exception e) {
            log.error("Unexpected error in checkInventoryBatchWithProductInfo: itemsCount={}", items.size(), e);
            throw new RuntimeException("Failed to check inventory batch", e);
        }
    }

    /**
     * Legacy method for backward compatibility  
     */
    public CheckInventoryBatchResponse checkInventoryBatch(List<InventoryCheckItem> items) {
        List<InventoryCheckItemWithInfo> itemsWithInfo = items.stream()
                .map(item -> new InventoryCheckItemWithInfo(
                        item.getProductId(), 
                        item.getQuantity(), 
                        "", "", 0.0))
                .toList();
        return checkInventoryBatchWithProductInfo(itemsWithInfo);
    }

    // Inner classes for request items
    public static class InventoryCheckItem {
        private final String productId;
        private final int quantity;

        public InventoryCheckItem(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public String getProductId() { return productId; }
        public int getQuantity() { return quantity; }
    }

    public static class InventoryCheckItemWithInfo {
        private final String productId;
        private final int quantity;
        private final String inventoryStatus;
        private final String productName;
        private final double price;

        public InventoryCheckItemWithInfo(String productId, int quantity, 
                String inventoryStatus, String productName, double price) {
            this.productId = productId;
            this.quantity = quantity;
            this.inventoryStatus = inventoryStatus;
            this.productName = productName;
            this.price = price;
        }

        public String getProductId() { return productId; }
        public int getQuantity() { return quantity; }
        public String getInventoryStatus() { return inventoryStatus; }
        public String getProductName() { return productName; }
        public double getPrice() { return price; }
    }
}