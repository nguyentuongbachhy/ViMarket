package com.ecommerce.grpc.inventory;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.53.0)",
    comments = "Source: inventory.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class InventoryServiceGrpc {

  private InventoryServiceGrpc() {}

  public static final String SERVICE_NAME = "ecommerce.inventory.InventoryService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.inventory.CheckInventoryRequest,
      com.ecommerce.grpc.inventory.CheckInventoryResponse> getCheckInventoryMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CheckInventory",
      requestType = com.ecommerce.grpc.inventory.CheckInventoryRequest.class,
      responseType = com.ecommerce.grpc.inventory.CheckInventoryResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.inventory.CheckInventoryRequest,
      com.ecommerce.grpc.inventory.CheckInventoryResponse> getCheckInventoryMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.inventory.CheckInventoryRequest, com.ecommerce.grpc.inventory.CheckInventoryResponse> getCheckInventoryMethod;
    if ((getCheckInventoryMethod = InventoryServiceGrpc.getCheckInventoryMethod) == null) {
      synchronized (InventoryServiceGrpc.class) {
        if ((getCheckInventoryMethod = InventoryServiceGrpc.getCheckInventoryMethod) == null) {
          InventoryServiceGrpc.getCheckInventoryMethod = getCheckInventoryMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.inventory.CheckInventoryRequest, com.ecommerce.grpc.inventory.CheckInventoryResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CheckInventory"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.inventory.CheckInventoryRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.inventory.CheckInventoryResponse.getDefaultInstance()))
              .setSchemaDescriptor(new InventoryServiceMethodDescriptorSupplier("CheckInventory"))
              .build();
        }
      }
    }
    return getCheckInventoryMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.ecommerce.grpc.inventory.CheckInventoryBatchRequest,
      com.ecommerce.grpc.inventory.CheckInventoryBatchResponse> getCheckInventoryBatchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CheckInventoryBatch",
      requestType = com.ecommerce.grpc.inventory.CheckInventoryBatchRequest.class,
      responseType = com.ecommerce.grpc.inventory.CheckInventoryBatchResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.ecommerce.grpc.inventory.CheckInventoryBatchRequest,
      com.ecommerce.grpc.inventory.CheckInventoryBatchResponse> getCheckInventoryBatchMethod() {
    io.grpc.MethodDescriptor<com.ecommerce.grpc.inventory.CheckInventoryBatchRequest, com.ecommerce.grpc.inventory.CheckInventoryBatchResponse> getCheckInventoryBatchMethod;
    if ((getCheckInventoryBatchMethod = InventoryServiceGrpc.getCheckInventoryBatchMethod) == null) {
      synchronized (InventoryServiceGrpc.class) {
        if ((getCheckInventoryBatchMethod = InventoryServiceGrpc.getCheckInventoryBatchMethod) == null) {
          InventoryServiceGrpc.getCheckInventoryBatchMethod = getCheckInventoryBatchMethod =
              io.grpc.MethodDescriptor.<com.ecommerce.grpc.inventory.CheckInventoryBatchRequest, com.ecommerce.grpc.inventory.CheckInventoryBatchResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CheckInventoryBatch"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.inventory.CheckInventoryBatchRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.ecommerce.grpc.inventory.CheckInventoryBatchResponse.getDefaultInstance()))
              .setSchemaDescriptor(new InventoryServiceMethodDescriptorSupplier("CheckInventoryBatch"))
              .build();
        }
      }
    }
    return getCheckInventoryBatchMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static InventoryServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<InventoryServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<InventoryServiceStub>() {
        @java.lang.Override
        public InventoryServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new InventoryServiceStub(channel, callOptions);
        }
      };
    return InventoryServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static InventoryServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<InventoryServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<InventoryServiceBlockingStub>() {
        @java.lang.Override
        public InventoryServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new InventoryServiceBlockingStub(channel, callOptions);
        }
      };
    return InventoryServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static InventoryServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<InventoryServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<InventoryServiceFutureStub>() {
        @java.lang.Override
        public InventoryServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new InventoryServiceFutureStub(channel, callOptions);
        }
      };
    return InventoryServiceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class InventoryServiceImplBase implements io.grpc.BindableService {

    /**
     */
    public void checkInventory(com.ecommerce.grpc.inventory.CheckInventoryRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.inventory.CheckInventoryResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCheckInventoryMethod(), responseObserver);
    }

    /**
     */
    public void checkInventoryBatch(com.ecommerce.grpc.inventory.CheckInventoryBatchRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.inventory.CheckInventoryBatchResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCheckInventoryBatchMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getCheckInventoryMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.ecommerce.grpc.inventory.CheckInventoryRequest,
                com.ecommerce.grpc.inventory.CheckInventoryResponse>(
                  this, METHODID_CHECK_INVENTORY)))
          .addMethod(
            getCheckInventoryBatchMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.ecommerce.grpc.inventory.CheckInventoryBatchRequest,
                com.ecommerce.grpc.inventory.CheckInventoryBatchResponse>(
                  this, METHODID_CHECK_INVENTORY_BATCH)))
          .build();
    }
  }

  /**
   */
  public static final class InventoryServiceStub extends io.grpc.stub.AbstractAsyncStub<InventoryServiceStub> {
    private InventoryServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected InventoryServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new InventoryServiceStub(channel, callOptions);
    }

    /**
     */
    public void checkInventory(com.ecommerce.grpc.inventory.CheckInventoryRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.inventory.CheckInventoryResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCheckInventoryMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void checkInventoryBatch(com.ecommerce.grpc.inventory.CheckInventoryBatchRequest request,
        io.grpc.stub.StreamObserver<com.ecommerce.grpc.inventory.CheckInventoryBatchResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCheckInventoryBatchMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class InventoryServiceBlockingStub extends io.grpc.stub.AbstractBlockingStub<InventoryServiceBlockingStub> {
    private InventoryServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected InventoryServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new InventoryServiceBlockingStub(channel, callOptions);
    }

    /**
     */
    public com.ecommerce.grpc.inventory.CheckInventoryResponse checkInventory(com.ecommerce.grpc.inventory.CheckInventoryRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCheckInventoryMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.ecommerce.grpc.inventory.CheckInventoryBatchResponse checkInventoryBatch(com.ecommerce.grpc.inventory.CheckInventoryBatchRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCheckInventoryBatchMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class InventoryServiceFutureStub extends io.grpc.stub.AbstractFutureStub<InventoryServiceFutureStub> {
    private InventoryServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected InventoryServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new InventoryServiceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.ecommerce.grpc.inventory.CheckInventoryResponse> checkInventory(
        com.ecommerce.grpc.inventory.CheckInventoryRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCheckInventoryMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.ecommerce.grpc.inventory.CheckInventoryBatchResponse> checkInventoryBatch(
        com.ecommerce.grpc.inventory.CheckInventoryBatchRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCheckInventoryBatchMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CHECK_INVENTORY = 0;
  private static final int METHODID_CHECK_INVENTORY_BATCH = 1;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final InventoryServiceImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(InventoryServiceImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_CHECK_INVENTORY:
          serviceImpl.checkInventory((com.ecommerce.grpc.inventory.CheckInventoryRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.inventory.CheckInventoryResponse>) responseObserver);
          break;
        case METHODID_CHECK_INVENTORY_BATCH:
          serviceImpl.checkInventoryBatch((com.ecommerce.grpc.inventory.CheckInventoryBatchRequest) request,
              (io.grpc.stub.StreamObserver<com.ecommerce.grpc.inventory.CheckInventoryBatchResponse>) responseObserver);
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

  private static abstract class InventoryServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    InventoryServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.ecommerce.grpc.inventory.InventoryProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("InventoryService");
    }
  }

  private static final class InventoryServiceFileDescriptorSupplier
      extends InventoryServiceBaseDescriptorSupplier {
    InventoryServiceFileDescriptorSupplier() {}
  }

  private static final class InventoryServiceMethodDescriptorSupplier
      extends InventoryServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    InventoryServiceMethodDescriptorSupplier(String methodName) {
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
      synchronized (InventoryServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new InventoryServiceFileDescriptorSupplier())
              .addMethod(getCheckInventoryMethod())
              .addMethod(getCheckInventoryBatchMethod())
              .build();
        }
      }
    }
    return result;
  }
}
