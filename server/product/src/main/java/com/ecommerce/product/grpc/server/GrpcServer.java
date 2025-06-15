package com.ecommerce.product.grpc.server;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ecommerce.product.grpc.interceptor.LoggingInterceptor;

import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class GrpcServer {

    @Value("${grpc.server.port:50053}")
    private int port;

    @Value("${grpc.server.host:localhost}")
    private String host;

    private Server server;

    private final ProductGrpcService productGrpcService;
    private final LoggingInterceptor loggingInterceptor;

    @PostConstruct
    public void start() throws IOException {
        try {
            server = NettyServerBuilder.forPort(port)
                    .addService(productGrpcService)
                    .intercept(loggingInterceptor)
                    .maxInboundMessageSize(10 * 1024 * 1024) // 10MB
                    .maxInboundMetadataSize(8192) // 8KB
                    .keepAliveTime(30, TimeUnit.SECONDS)
                    .keepAliveTimeout(5, TimeUnit.SECONDS)
                    .permitKeepAliveWithoutCalls(true)
                    .build()
                    .start();

            log.info("gRPC server started on {}:{}", host, port);

            // Start a thread to shut down the server when JVM is shutting down
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    GrpcServer.this.stop();
                } catch (InterruptedException e) {
                    log.error("Error shutting down gRPC server", e);
                    Thread.currentThread().interrupt();
                }
            }));
        } catch (IOException e) {
            log.error("Failed to start gRPC server", e);
            throw e;
        }
    }

    @PreDestroy
    public void stop() throws InterruptedException {
        if (server != null) {
            log.info("Shutting down gRPC server...");
            server.shutdown();
            
            if (!server.awaitTermination(30, TimeUnit.SECONDS)) {
                log.warn("gRPC server did not shutdown gracefully, forcing shutdown");
                server.shutdownNow();
                
                if (!server.awaitTermination(5, TimeUnit.SECONDS)) {
                    log.error("gRPC server did not terminate");
                }
            }
            
            log.info("gRPC server shut down successfully");
        }
    }

    // Block main thread to keep server alive (if needed)
    public void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }

    public boolean isRunning() {
        return server != null && !server.isShutdown();
    }

    public int getPort() {
        return port;
    }
}