package com.ecommerce.product.grpc.server;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.ecommerce.grpc.common.Status;
import com.ecommerce.grpc.product.CategoryRequest;
import com.ecommerce.grpc.product.ProductBatchRequest;
import com.ecommerce.grpc.product.ProductBatchResponse;
import com.ecommerce.grpc.product.ProductDetailRequest;
import com.ecommerce.grpc.product.ProductResponse;
import com.ecommerce.grpc.product.ProductResponseChunk;
import com.ecommerce.grpc.product.ProductServiceGrpc;
import com.ecommerce.grpc.product.ProductSummary;
import com.ecommerce.grpc.product.ProductUIAction;
import com.ecommerce.grpc.product.SearchProductRequest;
import com.ecommerce.product.dto.ProductDetailDTO;
import com.ecommerce.product.dto.ProductSummaryDTO;
import com.ecommerce.product.grpc.mapper.GrpcMapper;
import com.ecommerce.product.service.InventoryIntegrationService;
import com.ecommerce.product.service.ProductService;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductGrpcService extends ProductServiceGrpc.ProductServiceImplBase {

    private final ProductService productService;
    private final GrpcMapper grpcMapper;
    private final InventoryIntegrationService inventoryIntegrationService;

    @Override
    public void searchProduct(SearchProductRequest request, StreamObserver<ProductResponse> responseObserver) {
        Instant start = Instant.now();
        String query = request.getQuery();

        log.info("gRPC searchProduct called with query: {}", query);

        try {
            // Chuẩn bị UI action
            ProductUIAction uiAction = ProductUIAction.newBuilder()
                    .setType("redirect")
                    .setUrl("/search?q=" + java.net.URLEncoder.encode(query, "UTF-8"))
                    .putData("query", query)
                    .putData("timestamp", String.valueOf(System.currentTimeMillis()))
                    .build();

            String message = String.format("Tôi đã tìm thấy một số sản phẩm phù hợp với từ khóa '%s'.", query);

            // Tính độ trễ
            double latencyMs = Duration.between(start, Instant.now()).toMillis();

            // Tạo status
            Status status = Status.newBuilder()
                    .setCode(Status.Code.OK)
                    .setMessage("Success")
                    .build();

            // Tạo response
            ProductResponse response = ProductResponse.newBuilder()
                    .setMessage(message)
                    .setUiAction(uiAction)
                    .setStatus(status)
                    .setLatencyMs(latencyMs)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error in searchProduct gRPC service", e);
            sendErrorResponse(responseObserver, start, "Đã xảy ra lỗi khi tìm kiếm sản phẩm.", e);
        }
    }

    @Override
    public void getProductDetail(ProductDetailRequest request, StreamObserver<ProductResponse> responseObserver) {
        Instant start = Instant.now();
        String productId = request.getProductId();
        String productName = request.getProductName();

        log.info("gRPC getProductDetail called with id: {}, name: {}", productId, productName);

        try {
            // Lấy thông tin chi tiết sản phẩm từ service hiện có
            ProductDetailDTO product = productService.getProductById(productId);

            // Tạo UI action
            ProductUIAction.Builder uiActionBuilder = ProductUIAction.newBuilder()
                    .setType("show_product")
                    .setUrl("/product/" + productId);

            // Thêm data vào UI action
            Map<String, String> dataMap = new HashMap<>();
            dataMap.put("product_id", productId);
            dataMap.put("product_name", product.getName());
            dataMap.put("price", product.getPrice().toString());
            dataMap.put("inventory_status", product.getInventoryStatus() != null ? product.getInventoryStatus() : "");
            uiActionBuilder.putAllData(dataMap);

            ProductUIAction uiAction = uiActionBuilder.build();

            // Tạo message
            String message;
            if (!productName.isEmpty()) {
                message = String.format("Đây là thông tin chi tiết về sản phẩm '%s'.", productName);
            } else {
                message = String.format("Đây là thông tin chi tiết về sản phẩm '%s'.", product.getName());
            }

            // Tính độ trễ
            double latencyMs = Duration.between(start, Instant.now()).toMillis();

            // Tạo status
            Status status = Status.newBuilder()
                    .setCode(Status.Code.OK)
                    .setMessage("Success")
                    .build();

            // Tạo response
            ProductResponse response = ProductResponse.newBuilder()
                    .setMessage(message)
                    .setUiAction(uiAction)
                    .setStatus(status)
                    .setLatencyMs(latencyMs)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error in getProductDetail gRPC service", e);
            sendErrorResponse(responseObserver, start, "Đã xảy ra lỗi khi lấy thông tin chi tiết sản phẩm.", e);
        }
    }

    @Override
    public void getCategory(CategoryRequest request, StreamObserver<ProductResponse> responseObserver) {
        Instant start = Instant.now();
        String categoryId = request.getCategoryId();
        String categoryName = request.getCategoryName();

        log.info("gRPC getCategory called with id: {}, name: {}", categoryId, categoryName);

        try {
            // Tạo UI action
            ProductUIAction.Builder uiActionBuilder = ProductUIAction.newBuilder()
                    .setType("show_category")
                    .setUrl("/category/" + categoryId);

            // Thêm data vào UI action
            Map<String, String> dataMap = new HashMap<>();
            dataMap.put("category_id", categoryId);
            dataMap.put("category_name", categoryName);
            uiActionBuilder.putAllData(dataMap);

            ProductUIAction uiAction = uiActionBuilder.build();

            // Tạo message
            String message;
            if (!categoryName.isEmpty()) {
                message = String.format("Đây là các sản phẩm thuộc danh mục '%s'.", categoryName);
            } else {
                message = "Đây là các sản phẩm thuộc danh mục bạn quan tâm.";
            }

            // Tính độ trễ
            double latencyMs = Duration.between(start, Instant.now()).toMillis();

            // Tạo status
            Status status = Status.newBuilder()
                    .setCode(Status.Code.OK)
                    .setMessage("Success")
                    .build();

            // Tạo response
            ProductResponse response = ProductResponse.newBuilder()
                    .setMessage(message)
                    .setUiAction(uiAction)
                    .setStatus(status)
                    .setLatencyMs(latencyMs)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error in getCategory gRPC service", e);
            sendErrorResponse(responseObserver, start, "Đã xảy ra lỗi khi hiển thị sản phẩm theo danh mục.", e);
        }
    }

    @Override
    public void getProductsBatch(ProductBatchRequest request, StreamObserver<ProductBatchResponse> responseObserver) {
        Instant start = Instant.now();
        List<String> productIds = request.getProductIdsList();

        log.info("gRPC getProductsBatch called with {} ids", productIds.size());

        try {
            // Lấy thông tin sản phẩm từ service
            List<ProductSummaryDTO> products = productService.getProductsByIds(productIds);

            // Enrich with inventory information
            products = inventoryIntegrationService.enrichWithInventoryInfo(products);

            // Chuyển đổi sang message protobuf
            List<ProductSummary> productMessages = grpcMapper.toProductSummaryList(products);

            // Tính độ trễ
            double latencyMs = Duration.between(start, Instant.now()).toMillis();

            // Tạo status
            Status status = Status.newBuilder()
                    .setCode(Status.Code.OK)
                    .setMessage("Success")
                    .build();

            // Tạo metadata với thông tin bổ sung
            com.ecommerce.grpc.common.Metadata metadata = com.ecommerce.grpc.common.Metadata.newBuilder()
                    .putData("total_requested", String.valueOf(productIds.size()))
                    .putData("total_found", String.valueOf(products.size()))
                    .putData("inventory_enriched", "true")
                    .putData("processing_time_ms", String.valueOf(latencyMs))
                    .build();

            // Tạo response
            ProductBatchResponse response = ProductBatchResponse.newBuilder()
                    .addAllProducts(productMessages)
                    .setStatus(status)
                    .setLatencyMs(latencyMs)
                    .setMetadata(metadata)
                    .build();

            log.info("Successfully returned {} products out of {} requested ({}ms)", 
                    products.size(), productIds.size(), latencyMs);

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error in getProductsBatch gRPC service", e);

            // Tính độ trễ
            double latencyMs = Duration.between(start, Instant.now()).toMillis();

            // Tạo status lỗi
            Status status = Status.newBuilder()
                    .setCode(Status.Code.ERROR)
                    .setMessage("Error: " + e.getMessage())
                    .build();

            // Tạo response rỗng
            ProductBatchResponse response = ProductBatchResponse.newBuilder()
                    .setStatus(status)
                    .setLatencyMs(latencyMs)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
    }

    @Override
    public void searchProductStream(SearchProductRequest request,
            StreamObserver<ProductResponseChunk> responseObserver) {
        String query = request.getQuery();

        log.info("gRPC searchProductStream called with query: {}", query);

        try {
            // Chuẩn bị UI action
            ProductUIAction uiAction = ProductUIAction.newBuilder()
                    .setType("redirect")
                    .setUrl("/search?q=" + java.net.URLEncoder.encode(query, "UTF-8"))
                    .putData("query", query)
                    .putData("streaming", "true")
                    .build();

            // Tạo message
            String message = String
                    .format("Tôi đã tìm kiếm sản phẩm '%s' cho bạn và đã tìm thấy một số kết quả phù hợp.", query);

            // Tạo status
            Status status = Status.newBuilder()
                    .setCode(Status.Code.OK)
                    .setMessage("Success")
                    .build();

            // Chia message thành các chunk để streaming
            String[] chunks = message.split("\\s+");
            StringBuilder builder = new StringBuilder();

            // Gửi các chunk
            for (int i = 0; i < chunks.length; i++) {
                builder.append(chunks[i]).append(" ");

                if ((i + 1) % 3 == 0 || i == chunks.length - 1) {
                    boolean isLast = (i == chunks.length - 1);

                    ProductResponseChunk chunk = ProductResponseChunk.newBuilder()
                            .setChunk(builder.toString().trim())
                            .setFinished(isLast)
                            .setStatus(status)
                            .build();

                    // Chỉ gửi UI action ở chunk cuối cùng
                    if (isLast) {
                        chunk = chunk.toBuilder().setUiAction(uiAction).build();
                    }

                    responseObserver.onNext(chunk);

                    // Giả lập độ trễ giữa các chunk
                    try {
                        Thread.sleep(50);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }

                    builder = new StringBuilder();
                }
            }

            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error in searchProductStream gRPC service", e);

            // Tạo status lỗi
            Status status = Status.newBuilder()
                    .setCode(Status.Code.ERROR)
                    .setMessage("Error: " + e.getMessage())
                    .build();

            // Gửi chunk lỗi
            ProductResponseChunk errorChunk = ProductResponseChunk.newBuilder()
                    .setChunk("Đã xảy ra lỗi khi tìm kiếm sản phẩm.")
                    .setFinished(true)
                    .setStatus(status)
                    .build();

            responseObserver.onNext(errorChunk);
            responseObserver.onCompleted();
        }
    }

    private void sendErrorResponse(StreamObserver<ProductResponse> responseObserver, 
            Instant start, String errorMessage, Exception e) {
        // Tính độ trễ
        double latencyMs = Duration.between(start, Instant.now()).toMillis();

        // Tạo status lỗi
        Status status = Status.newBuilder()
                .setCode(Status.Code.ERROR)
                .setMessage("Error: " + e.getMessage())
                .build();

        // Tạo response lỗi
        ProductResponse response = ProductResponse.newBuilder()
                .setMessage(errorMessage)
                .setStatus(status)
                .setLatencyMs(latencyMs)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}