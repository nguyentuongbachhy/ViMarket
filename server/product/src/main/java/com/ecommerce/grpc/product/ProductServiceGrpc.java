package com.ecommerce.grpc.product;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.53.0)",
    comments = "Source: product.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class ProductServiceGrpc {

  private ProductServiceGrpc() {}

  public static final String SERVICE_NAME = "ecommerce.product.ProductService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.product.SearchProductRequest,
      com.ecommerce.grpc.product.ProductResponse> getSearchProductMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SearchProduct",
      requestType = com.ecommerce.grpc.product.SearchProductRequest.class,
      responseType = com.ecommerce.grpc.product.ProductResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.product.SearchProductRequest,
      com.ecommerce.grpc.product.ProductResponse> getSearchProductMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.product.SearchProductRequest, com.ecommerce.grpc.product.ProductResponse> getSearchProductMethod;
    if ((getSearchProductMethod = ProductServiceGrpc.getSearchProductMethod) == null) {
      synchronized (ProductServiceGrpc.class) {
        if ((getSearchProductMethod = ProductServiceGrpc.getSearchProductMethod) == null) {
          ProductServiceGrpc.getSearchProductMethod = getSearchProductMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.product.SearchProductRequest, com.ecommerce.grpc.product.ProductResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SearchProduct"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.SearchProductRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductResponse.getDefaultInstance()))
              .setSchemaDescriptor(new ProductServiceMethodDescriptorSupplier("SearchProduct"))
              .build();
        }
      }
    }
    return getSearchProductMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.product.ProductDetailRequest,
      com.ecommerce.grpc.product.ProductResponse> getGetProductDetailMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetProductDetail",
      requestType = com.ecommerce.grpc.product.ProductDetailRequest.class,
      responseType = com.ecommerce.grpc.product.ProductResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.product.ProductDetailRequest,
      com.ecommerce.grpc.product.ProductResponse> getGetProductDetailMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.product.ProductDetailRequest, com.ecommerce.grpc.product.ProductResponse> getGetProductDetailMethod;
    if ((getGetProductDetailMethod = ProductServiceGrpc.getGetProductDetailMethod) == null) {
      synchronized (ProductServiceGrpc.class) {
        if ((getGetProductDetailMethod = ProductServiceGrpc.getGetProductDetailMethod) == null) {
          ProductServiceGrpc.getGetProductDetailMethod = getGetProductDetailMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.product.ProductDetailRequest, com.ecommerce.grpc.product.ProductResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetProductDetail"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductDetailRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductResponse.getDefaultInstance()))
              .setSchemaDescriptor(new ProductServiceMethodDescriptorSupplier("GetProductDetail"))
              .build();
        }
      }
    }
    return getGetProductDetailMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.product.CategoryRequest,
      com.ecommerce.grpc.product.ProductResponse> getGetCategoryMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetCategory",
      requestType = com.ecommerce.grpc.product.CategoryRequest.class,
      responseType = com.ecommerce.grpc.product.ProductResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.product.CategoryRequest,
      com.ecommerce.grpc.product.ProductResponse> getGetCategoryMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.product.CategoryRequest, com.ecommerce.grpc.product.ProductResponse> getGetCategoryMethod;
    if ((getGetCategoryMethod = ProductServiceGrpc.getGetCategoryMethod) == null) {
      synchronized (ProductServiceGrpc.class) {
        if ((getGetCategoryMethod = ProductServiceGrpc.getGetCategoryMethod) == null) {
          ProductServiceGrpc.getGetCategoryMethod = getGetCategoryMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.product.CategoryRequest, com.ecommerce.grpc.product.ProductResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetCategory"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.CategoryRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductResponse.getDefaultInstance()))
              .setSchemaDescriptor(new ProductServiceMethodDescriptorSupplier("GetCategory"))
              .build();
        }
      }
    }
    return getGetCategoryMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.product.ProductBatchRequest,
      com.ecommerce.grpc.product.ProductBatchResponse> getGetProductsBatchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetProductsBatch",
      requestType = com.ecommerce.grpc.product.ProductBatchRequest.class,
      responseType = com.ecommerce.grpc.product.ProductBatchResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.product.ProductBatchRequest,
      com.ecommerce.grpc.product.ProductBatchResponse> getGetProductsBatchMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.product.ProductBatchRequest, com.ecommerce.grpc.product.ProductBatchResponse> getGetProductsBatchMethod;
    if ((getGetProductsBatchMethod = ProductServiceGrpc.getGetProductsBatchMethod) == null) {
      synchronized (ProductServiceGrpc.class) {
        if ((getGetProductsBatchMethod = ProductServiceGrpc.getGetProductsBatchMethod) == null) {
          ProductServiceGrpc.getGetProductsBatchMethod = getGetProductsBatchMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.product.ProductBatchRequest, com.ecommerce.grpc.product.ProductBatchResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetProductsBatch"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductBatchRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductBatchResponse.getDefaultInstance()))
              .setSchemaDescriptor(new ProductServiceMethodDescriptorSupplier("GetProductsBatch"))
              .build();
        }
      }
    }
    return getGetProductsBatchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.product.SearchProductRequest,
      com.ecommerce.grpc.product.ProductResponseChunk> getSearchProductStreamMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SearchProductStream",
      requestType = com.ecommerce.grpc.product.SearchProductRequest.class,
      responseType = com.ecommerce.grpc.product.ProductResponseChunk.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.product.SearchProductRequest,
      com.ecommerce.grpc.product.ProductResponseChunk> getSearchProductStreamMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.product.SearchProductRequest, com.ecommerce.grpc.product.ProductResponseChunk> getSearchProductStreamMethod;
    if ((getSearchProductStreamMethod = ProductServiceGrpc.getSearchProductStreamMethod) == null) {
      synchronized (ProductServiceGrpc.class) {
        if ((getSearchProductStreamMethod = ProductServiceGrpc.getSearchProductStreamMethod) == null) {
          ProductServiceGrpc.getSearchProductStreamMethod = getSearchProductStreamMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.product.SearchProductRequest, com.ecommerce.grpc.product.ProductResponseChunk>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SearchProductStream"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.SearchProductRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.product.ProductResponseChunk.getDefaultInstance()))
              .setSchemaDescriptor(new ProductServiceMethodDescriptorSupplier("SearchProductStream"))
              .build();
        }
      }
    }
    return getSearchProductStreamMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static ProductServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ProductServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ProductServiceStub>() {
        @java.lang.Override
        public ProductServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ProductServiceStub(channel, callOptions);
        }
      };
    return ProductServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static ProductServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ProductServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ProductServiceBlockingStub>() {
        @java.lang.Override
        public ProductServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ProductServiceBlockingStub(channel, callOptions);
        }
      };
    return ProductServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static ProductServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ProductServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ProductServiceFutureStub>() {
        @java.lang.Override
        public ProductServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ProductServiceFutureStub(channel, callOptions);
        }
      };
    return ProductServiceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class ProductServiceImplBase implements io.grpc.BindableService {

    /**
     * <pre>
     * Search Product Service
     * </pre>
     */
    public void searchProduct(com.ecommerce.grpc.product.SearchProductRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchProductMethod(), responseObserver);
    }

    /**
     * <pre>
     * Product Detail Service
     * </pre>
     */
    public void getProductDetail(com.ecommerce.grpc.product.ProductDetailRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetProductDetailMethod(), responseObserver);
    }

    /**
     * <pre>
     * Category Service
     * </pre>
     */
    public void getCategory(com.ecommerce.grpc.product.CategoryRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetCategoryMethod(), responseObserver);
    }

    /**
     * <pre>
     * Batch Product Service
     * </pre>
     */
    public void getProductsBatch(com.ecommerce.grpc.product.ProductBatchRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductBatchResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetProductsBatchMethod(), responseObserver);
    }

    /**
     * <pre>
     * Streaming Endpoints (reduce latency further)
     * </pre>
     */
    public void searchProductStream(com.ecommerce.grpc.product.SearchProductRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponseChunk> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchProductStreamMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getSearchProductMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.ecommerce.grpc.product.SearchProductRequest,
                com.ecommerce.grpc.product.ProductResponse>(
                  this, METHODID_SEARCH_PRODUCT)))
          .addMethod(
            getGetProductDetailMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.ecommerce.grpc.product.ProductDetailRequest,
                com.ecommerce.grpc.product.ProductResponse>(
                  this, METHODID_GET_PRODUCT_DETAIL)))
          .addMethod(
            getGetCategoryMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.ecommerce.grpc.product.CategoryRequest,
                com.ecommerce.grpc.product.ProductResponse>(
                  this, METHODID_GET_CATEGORY)))
          .addMethod(
            getGetProductsBatchMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.ecommerce.grpc.product.ProductBatchRequest,
                com.ecommerce.grpc.product.ProductBatchResponse>(
                  this, METHODID_GET_PRODUCTS_BATCH)))
          .addMethod(
            getSearchProductStreamMethod(),
            io.grpc.stub.ServerCalls.asyncServerStreamingCall(
              new MethodHandlers<
                com.ecommerce.grpc.product.SearchProductRequest,
                com.ecommerce.grpc.product.ProductResponseChunk>(
                  this, METHODID_SEARCH_PRODUCT_STREAM)))
          .build();
    }
  }

  /**
   */
  public static final class ProductServiceStub extends io.grpc.stub.AbstractAsyncStub<ProductServiceStub> {
    private ProductServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ProductServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ProductServiceStub(channel, callOptions);
    }

    /**
     * <pre>
     * Search Product Service
     * </pre>
     */
    public void searchProduct(com.ecommerce.grpc.product.SearchProductRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSearchProductMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Product Detail Service
     * </pre>
     */
    public void getProductDetail(com.ecommerce.grpc.product.ProductDetailRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetProductDetailMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Category Service
     * </pre>
     */
    public void getCategory(com.ecommerce.grpc.product.CategoryRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetCategoryMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Batch Product Service
     * </pre>
     */
    public void getProductsBatch(com.ecommerce.grpc.product.ProductBatchRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductBatchResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetProductsBatchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Streaming Endpoints (reduce latency further)
     * </pre>
     */
    public void searchProductStream(com.ecommerce.grpc.product.SearchProductRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponseChunk> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchProductStreamMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class ProductServiceBlockingStub extends io.grpc.stub.AbstractBlockingStub<ProductServiceBlockingStub> {
    private ProductServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ProductServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ProductServiceBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Search Product Service
     * </pre>
     */
    public com.ecommerce.grpc.product.ProductResponse searchProduct(com.ecommerce.grpc.product.SearchProductRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSearchProductMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Product Detail Service
     * </pre>
     */
    public com.ecommerce.grpc.product.ProductResponse getProductDetail(com.ecommerce.grpc.product.ProductDetailRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetProductDetailMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Category Service
     * </pre>
     */
    public com.ecommerce.grpc.product.ProductResponse getCategory(com.ecommerce.grpc.product.CategoryRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetCategoryMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Batch Product Service
     * </pre>
     */
    public com.ecommerce.grpc.product.ProductBatchResponse getProductsBatch(com.ecommerce.grpc.product.ProductBatchRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetProductsBatchMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Streaming Endpoints (reduce latency further)
     * </pre>
     */
    public java.util.Iterator<com.ecommerce.grpc.product.ProductResponseChunk> searchProductStream(
        com.ecommerce.grpc.product.SearchProductRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchProductStreamMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class ProductServiceFutureStub extends io.grpc.stub.AbstractFutureStub<ProductServiceFutureStub> {
    private ProductServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ProductServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ProductServiceFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Search Product Service
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.ecommerce.grpc.product.ProductResponse> searchProduct(
        com.ecommerce.grpc.product.SearchProductRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSearchProductMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Product Detail Service
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.ecommerce.grpc.product.ProductResponse> getProductDetail(
        com.ecommerce.grpc.product.ProductDetailRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetProductDetailMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Category Service
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.ecommerce.grpc.product.ProductResponse> getCategory(
        com.ecommerce.grpc.product.CategoryRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetCategoryMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Batch Product Service
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.ecommerce.grpc.product.ProductBatchResponse> getProductsBatch(
        com.ecommerce.grpc.product.ProductBatchRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetProductsBatchMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_SEARCH_PRODUCT = 0;
  private static final int METHODID_GET_PRODUCT_DETAIL = 1;
  private static final int METHODID_GET_CATEGORY = 2;
  private static final int METHODID_GET_PRODUCTS_BATCH = 3;
  private static final int METHODID_SEARCH_PRODUCT_STREAM = 4;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final ProductServiceImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(ProductServiceImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_SEARCH_PRODUCT:
          serviceImpl.searchProduct((com.ecommerce.grpc.product.SearchProductRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse>) responseObserver);
          break;
        case METHODID_GET_PRODUCT_DETAIL:
          serviceImpl.getProductDetail((com.ecommerce.grpc.product.ProductDetailRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse>) responseObserver);
          break;
        case METHODID_GET_CATEGORY:
          serviceImpl.getCategory((com.ecommerce.grpc.product.CategoryRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponse>) responseObserver);
          break;
        case METHODID_GET_PRODUCTS_BATCH:
          serviceImpl.getProductsBatch((com.ecommerce.grpc.product.ProductBatchRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductBatchResponse>) responseObserver);
          break;
        case METHODID_SEARCH_PRODUCT_STREAM:
          serviceImpl.searchProductStream((com.ecommerce.grpc.product.SearchProductRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.product.ProductResponseChunk>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  private static abstract class ProductServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    ProductServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.ecommerce.grpc.product.ProductProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("ProductService");
    }
  }

  private static final class ProductServiceFileDescriptorSupplier
      extends ProductServiceBaseDescriptorSupplier {
    ProductServiceFileDescriptorSupplier() {}
  }

  private static final class ProductServiceMethodDescriptorSupplier
      extends ProductServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    ProductServiceMethodDescriptorSupplier(String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (ProductServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new ProductServiceFileDescriptorSupplier())
              .addMethod(getSearchProductMethod())
              .addMethod(getGetProductDetailMethod())
              .addMethod(getGetCategoryMethod())
              .addMethod(getGetProductsBatchMethod())
              .addMethod(getSearchProductStreamMethod())
              .build();
        }
      }
    }
    return result;
  }
}
