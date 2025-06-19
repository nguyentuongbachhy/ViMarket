package com.ecommerce.product.grpc.interceptor;

import org.springframework.stereotype.Component;

import io.grpc.ForwardingServerCall;
import io.grpc.ForwardingServerCallListener;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class LoggingInterceptor implements ServerInterceptor {

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String methodName = call.getMethodDescriptor().getFullMethodName();
        long startTime = System.currentTimeMillis();

        log.info("gRPC call started: {}", methodName);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT>(
                next.startCall(new ForwardingServerCall.SimpleForwardingServerCall<ReqT, RespT>(call) {
                    @Override
                    public void close(Status status, Metadata trailers) {
                        long endTime = System.currentTimeMillis();
                        long latency = endTime - startTime;

                        if (status.isOk()) {
                            log.info("gRPC call completed: {} - completed in {} ms", methodName, latency);
                        } else {
                            log.error("gRPC call failed: {} - status: {} message: {} - took {} ms",
                                    methodName, status.getCode(), status.getDescription(), latency);
                        }

                        super.close(status, trailers);
                    }
                }, headers)) {
        };
    }
}