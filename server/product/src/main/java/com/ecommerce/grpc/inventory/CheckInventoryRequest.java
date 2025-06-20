// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: inventory.proto

package com.ecommerce.grpc.inventory;

/**
 * Protobuf type {@code ecommerce.inventory.CheckInventoryRequest}
 */
public final class CheckInventoryRequest extends
    com.google.protobuf.GeneratedMessageV3 implements
    // @@protoc_insertion_point(message_implements:ecommerce.inventory.CheckInventoryRequest)
    CheckInventoryRequestOrBuilder {
private static final long serialVersionUID = 0L;
  // Use CheckInventoryRequest.newBuilder() to construct.
  private CheckInventoryRequest(com.google.protobuf.GeneratedMessageV3.Builder<?> builder) {
    super(builder);
  }
  private CheckInventoryRequest() {
    productId_ = "";
  }

  @java.lang.Override
  @SuppressWarnings({"unused"})
  protected java.lang.Object newInstance(
      UnusedPrivateParameter unused) {
    return new CheckInventoryRequest();
  }

  @java.lang.Override
  public final com.google.protobuf.UnknownFieldSet
  getUnknownFields() {
    return this.unknownFields;
  }
  private CheckInventoryRequest(
      com.google.protobuf.CodedInputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    this();
    if (extensionRegistry == null) {
      throw new java.lang.NullPointerException();
    }
    int mutable_bitField0_ = 0;
    com.google.protobuf.UnknownFieldSet.Builder unknownFields =
        com.google.protobuf.UnknownFieldSet.newBuilder();
    try {
      boolean done = false;
      while (!done) {
        int tag = input.readTag();
        switch (tag) {
          case 0:
            done = true;
            break;
          case 10: {
            java.lang.String s = input.readStringRequireUtf8();

            productId_ = s;
            break;
          }
          case 16: {

            quantity_ = input.readInt32();
            break;
          }
          case 26: {
            com.ecommerce.grpc.common.Metadata.Builder subBuilder = null;
            if (metadata_ != null) {
              subBuilder = metadata_.toBuilder();
            }
            metadata_ = input.readMessage(com.ecommerce.grpc.common.Metadata.parser(), extensionRegistry);
            if (subBuilder != null) {
              subBuilder.mergeFrom(metadata_);
              metadata_ = subBuilder.buildPartial();
            }

            break;
          }
          case 34: {
            com.ecommerce.grpc.inventory.ProductInfo.Builder subBuilder = null;
            if (((bitField0_ & 0x00000001) != 0)) {
              subBuilder = productInfo_.toBuilder();
            }
            productInfo_ = input.readMessage(com.ecommerce.grpc.inventory.ProductInfo.parser(), extensionRegistry);
            if (subBuilder != null) {
              subBuilder.mergeFrom(productInfo_);
              productInfo_ = subBuilder.buildPartial();
            }
            bitField0_ |= 0x00000001;
            break;
          }
          default: {
            if (!parseUnknownField(
                input, unknownFields, extensionRegistry, tag)) {
              done = true;
            }
            break;
          }
        }
      }
    } catch (com.google.protobuf.InvalidProtocolBufferException e) {
      throw e.setUnfinishedMessage(this);
    } catch (com.google.protobuf.UninitializedMessageException e) {
      throw e.asInvalidProtocolBufferException().setUnfinishedMessage(this);
    } catch (java.io.IOException e) {
      throw new com.google.protobuf.InvalidProtocolBufferException(
          e).setUnfinishedMessage(this);
    } finally {
      this.unknownFields = unknownFields.build();
      makeExtensionsImmutable();
    }
  }
  public static final com.google.protobuf.Descriptors.Descriptor
      getDescriptor() {
    return com.ecommerce.grpc.inventory.InventoryProto.internal_static_ecommerce_inventory_CheckInventoryRequest_descriptor;
  }

  @java.lang.Override
  protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internalGetFieldAccessorTable() {
    return com.ecommerce.grpc.inventory.InventoryProto.internal_static_ecommerce_inventory_CheckInventoryRequest_fieldAccessorTable
        .ensureFieldAccessorsInitialized(
            com.ecommerce.grpc.inventory.CheckInventoryRequest.class, com.ecommerce.grpc.inventory.CheckInventoryRequest.Builder.class);
  }

  private int bitField0_;
  public static final int PRODUCT_ID_FIELD_NUMBER = 1;
  private volatile java.lang.Object productId_;
  /**
   * <code>string product_id = 1;</code>
   * @return The productId.
   */
  @java.lang.Override
  public java.lang.String getProductId() {
    java.lang.Object ref = productId_;
    if (ref instanceof java.lang.String) {
      return (java.lang.String) ref;
    } else {
      com.google.protobuf.ByteString bs = 
          (com.google.protobuf.ByteString) ref;
      java.lang.String s = bs.toStringUtf8();
      productId_ = s;
      return s;
    }
  }
  /**
   * <code>string product_id = 1;</code>
   * @return The bytes for productId.
   */
  @java.lang.Override
  public com.google.protobuf.ByteString
      getProductIdBytes() {
    java.lang.Object ref = productId_;
    if (ref instanceof java.lang.String) {
      com.google.protobuf.ByteString b = 
          com.google.protobuf.ByteString.copyFromUtf8(
              (java.lang.String) ref);
      productId_ = b;
      return b;
    } else {
      return (com.google.protobuf.ByteString) ref;
    }
  }

  public static final int QUANTITY_FIELD_NUMBER = 2;
  private int quantity_;
  /**
   * <code>int32 quantity = 2;</code>
   * @return The quantity.
   */
  @java.lang.Override
  public int getQuantity() {
    return quantity_;
  }

  public static final int METADATA_FIELD_NUMBER = 3;
  private com.ecommerce.grpc.common.Metadata metadata_;
  /**
   * <code>.ecommerce.common.Metadata metadata = 3;</code>
   * @return Whether the metadata field is set.
   */
  @java.lang.Override
  public boolean hasMetadata() {
    return metadata_ != null;
  }
  /**
   * <code>.ecommerce.common.Metadata metadata = 3;</code>
   * @return The metadata.
   */
  @java.lang.Override
  public com.ecommerce.grpc.common.Metadata getMetadata() {
    return metadata_ == null ? com.ecommerce.grpc.common.Metadata.getDefaultInstance() : metadata_;
  }
  /**
   * <code>.ecommerce.common.Metadata metadata = 3;</code>
   */
  @java.lang.Override
  public com.ecommerce.grpc.common.MetadataOrBuilder getMetadataOrBuilder() {
    return getMetadata();
  }

  public static final int PRODUCT_INFO_FIELD_NUMBER = 4;
  private com.ecommerce.grpc.inventory.ProductInfo productInfo_;
  /**
   * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
   * @return Whether the productInfo field is set.
   */
  @java.lang.Override
  public boolean hasProductInfo() {
    return ((bitField0_ & 0x00000001) != 0);
  }
  /**
   * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
   * @return The productInfo.
   */
  @java.lang.Override
  public com.ecommerce.grpc.inventory.ProductInfo getProductInfo() {
    return productInfo_ == null ? com.ecommerce.grpc.inventory.ProductInfo.getDefaultInstance() : productInfo_;
  }
  /**
   * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
   */
  @java.lang.Override
  public com.ecommerce.grpc.inventory.ProductInfoOrBuilder getProductInfoOrBuilder() {
    return productInfo_ == null ? com.ecommerce.grpc.inventory.ProductInfo.getDefaultInstance() : productInfo_;
  }

  private byte memoizedIsInitialized = -1;
  @java.lang.Override
  public final boolean isInitialized() {
    byte isInitialized = memoizedIsInitialized;
    if (isInitialized == 1) return true;
    if (isInitialized == 0) return false;

    memoizedIsInitialized = 1;
    return true;
  }

  @java.lang.Override
  public void writeTo(com.google.protobuf.CodedOutputStream output)
                      throws java.io.IOException {
    if (!com.google.protobuf.GeneratedMessageV3.isStringEmpty(productId_)) {
      com.google.protobuf.GeneratedMessageV3.writeString(output, 1, productId_);
    }
    if (quantity_ != 0) {
      output.writeInt32(2, quantity_);
    }
    if (metadata_ != null) {
      output.writeMessage(3, getMetadata());
    }
    if (((bitField0_ & 0x00000001) != 0)) {
      output.writeMessage(4, getProductInfo());
    }
    unknownFields.writeTo(output);
  }

  @java.lang.Override
  public int getSerializedSize() {
    int size = memoizedSize;
    if (size != -1) return size;

    size = 0;
    if (!com.google.protobuf.GeneratedMessageV3.isStringEmpty(productId_)) {
      size += com.google.protobuf.GeneratedMessageV3.computeStringSize(1, productId_);
    }
    if (quantity_ != 0) {
      size += com.google.protobuf.CodedOutputStream
        .computeInt32Size(2, quantity_);
    }
    if (metadata_ != null) {
      size += com.google.protobuf.CodedOutputStream
        .computeMessageSize(3, getMetadata());
    }
    if (((bitField0_ & 0x00000001) != 0)) {
      size += com.google.protobuf.CodedOutputStream
        .computeMessageSize(4, getProductInfo());
    }
    size += unknownFields.getSerializedSize();
    memoizedSize = size;
    return size;
  }

  @java.lang.Override
  public boolean equals(final java.lang.Object obj) {
    if (obj == this) {
     return true;
    }
    if (!(obj instanceof com.ecommerce.grpc.inventory.CheckInventoryRequest)) {
      return super.equals(obj);
    }
    com.ecommerce.grpc.inventory.CheckInventoryRequest other = (com.ecommerce.grpc.inventory.CheckInventoryRequest) obj;

    if (!getProductId()
        .equals(other.getProductId())) return false;
    if (getQuantity()
        != other.getQuantity()) return false;
    if (hasMetadata() != other.hasMetadata()) return false;
    if (hasMetadata()) {
      if (!getMetadata()
          .equals(other.getMetadata())) return false;
    }
    if (hasProductInfo() != other.hasProductInfo()) return false;
    if (hasProductInfo()) {
      if (!getProductInfo()
          .equals(other.getProductInfo())) return false;
    }
    if (!unknownFields.equals(other.unknownFields)) return false;
    return true;
  }

  @java.lang.Override
  public int hashCode() {
    if (memoizedHashCode != 0) {
      return memoizedHashCode;
    }
    int hash = 41;
    hash = (19 * hash) + getDescriptor().hashCode();
    hash = (37 * hash) + PRODUCT_ID_FIELD_NUMBER;
    hash = (53 * hash) + getProductId().hashCode();
    hash = (37 * hash) + QUANTITY_FIELD_NUMBER;
    hash = (53 * hash) + getQuantity();
    if (hasMetadata()) {
      hash = (37 * hash) + METADATA_FIELD_NUMBER;
      hash = (53 * hash) + getMetadata().hashCode();
    }
    if (hasProductInfo()) {
      hash = (37 * hash) + PRODUCT_INFO_FIELD_NUMBER;
      hash = (53 * hash) + getProductInfo().hashCode();
    }
    hash = (29 * hash) + unknownFields.hashCode();
    memoizedHashCode = hash;
    return hash;
  }

  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      java.nio.ByteBuffer data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      java.nio.ByteBuffer data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      com.google.protobuf.ByteString data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      com.google.protobuf.ByteString data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(byte[] data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      byte[] data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input, extensionRegistry);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseDelimitedFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseDelimitedFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input, extensionRegistry);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      com.google.protobuf.CodedInputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static com.ecommerce.grpc.inventory.CheckInventoryRequest parseFrom(
      com.google.protobuf.CodedInputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input, extensionRegistry);
  }

  @java.lang.Override
  public Builder newBuilderForType() { return newBuilder(); }
  public static Builder newBuilder() {
    return DEFAULT_INSTANCE.toBuilder();
  }
  public static Builder newBuilder(com.ecommerce.grpc.inventory.CheckInventoryRequest prototype) {
    return DEFAULT_INSTANCE.toBuilder().mergeFrom(prototype);
  }
  @java.lang.Override
  public Builder toBuilder() {
    return this == DEFAULT_INSTANCE
        ? new Builder() : new Builder().mergeFrom(this);
  }

  @java.lang.Override
  protected Builder newBuilderForType(
      com.google.protobuf.GeneratedMessageV3.BuilderParent parent) {
    Builder builder = new Builder(parent);
    return builder;
  }
  /**
   * Protobuf type {@code ecommerce.inventory.CheckInventoryRequest}
   */
  public static final class Builder extends
      com.google.protobuf.GeneratedMessageV3.Builder<Builder> implements
      // @@protoc_insertion_point(builder_implements:ecommerce.inventory.CheckInventoryRequest)
      com.ecommerce.grpc.inventory.CheckInventoryRequestOrBuilder {
    public static final com.google.protobuf.Descriptors.Descriptor
        getDescriptor() {
      return com.ecommerce.grpc.inventory.InventoryProto.internal_static_ecommerce_inventory_CheckInventoryRequest_descriptor;
    }

    @java.lang.Override
    protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
        internalGetFieldAccessorTable() {
      return com.ecommerce.grpc.inventory.InventoryProto.internal_static_ecommerce_inventory_CheckInventoryRequest_fieldAccessorTable
          .ensureFieldAccessorsInitialized(
              com.ecommerce.grpc.inventory.CheckInventoryRequest.class, com.ecommerce.grpc.inventory.CheckInventoryRequest.Builder.class);
    }

    // Construct using com.ecommerce.grpc.inventory.CheckInventoryRequest.newBuilder()
    private Builder() {
      maybeForceBuilderInitialization();
    }

    private Builder(
        com.google.protobuf.GeneratedMessageV3.BuilderParent parent) {
      super(parent);
      maybeForceBuilderInitialization();
    }
    private void maybeForceBuilderInitialization() {
      if (com.google.protobuf.GeneratedMessageV3
              .alwaysUseFieldBuilders) {
        getProductInfoFieldBuilder();
      }
    }
    @java.lang.Override
    public Builder clear() {
      super.clear();
      productId_ = "";

      quantity_ = 0;

      if (metadataBuilder_ == null) {
        metadata_ = null;
      } else {
        metadata_ = null;
        metadataBuilder_ = null;
      }
      if (productInfoBuilder_ == null) {
        productInfo_ = null;
      } else {
        productInfoBuilder_.clear();
      }
      bitField0_ = (bitField0_ & ~0x00000001);
      return this;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.Descriptor
        getDescriptorForType() {
      return com.ecommerce.grpc.inventory.InventoryProto.internal_static_ecommerce_inventory_CheckInventoryRequest_descriptor;
    }

    @java.lang.Override
    public com.ecommerce.grpc.inventory.CheckInventoryRequest getDefaultInstanceForType() {
      return com.ecommerce.grpc.inventory.CheckInventoryRequest.getDefaultInstance();
    }

    @java.lang.Override
    public com.ecommerce.grpc.inventory.CheckInventoryRequest build() {
      com.ecommerce.grpc.inventory.CheckInventoryRequest result = buildPartial();
      if (!result.isInitialized()) {
        throw newUninitializedMessageException(result);
      }
      return result;
    }

    @java.lang.Override
    public com.ecommerce.grpc.inventory.CheckInventoryRequest buildPartial() {
      com.ecommerce.grpc.inventory.CheckInventoryRequest result = new com.ecommerce.grpc.inventory.CheckInventoryRequest(this);
      int from_bitField0_ = bitField0_;
      int to_bitField0_ = 0;
      result.productId_ = productId_;
      result.quantity_ = quantity_;
      if (metadataBuilder_ == null) {
        result.metadata_ = metadata_;
      } else {
        result.metadata_ = metadataBuilder_.build();
      }
      if (((from_bitField0_ & 0x00000001) != 0)) {
        if (productInfoBuilder_ == null) {
          result.productInfo_ = productInfo_;
        } else {
          result.productInfo_ = productInfoBuilder_.build();
        }
        to_bitField0_ |= 0x00000001;
      }
      result.bitField0_ = to_bitField0_;
      onBuilt();
      return result;
    }

    @java.lang.Override
    public Builder clone() {
      return super.clone();
    }
    @java.lang.Override
    public Builder setField(
        com.google.protobuf.Descriptors.FieldDescriptor field,
        java.lang.Object value) {
      return super.setField(field, value);
    }
    @java.lang.Override
    public Builder clearField(
        com.google.protobuf.Descriptors.FieldDescriptor field) {
      return super.clearField(field);
    }
    @java.lang.Override
    public Builder clearOneof(
        com.google.protobuf.Descriptors.OneofDescriptor oneof) {
      return super.clearOneof(oneof);
    }
    @java.lang.Override
    public Builder setRepeatedField(
        com.google.protobuf.Descriptors.FieldDescriptor field,
        int index, java.lang.Object value) {
      return super.setRepeatedField(field, index, value);
    }
    @java.lang.Override
    public Builder addRepeatedField(
        com.google.protobuf.Descriptors.FieldDescriptor field,
        java.lang.Object value) {
      return super.addRepeatedField(field, value);
    }
    @java.lang.Override
    public Builder mergeFrom(com.google.protobuf.Message other) {
      if (other instanceof com.ecommerce.grpc.inventory.CheckInventoryRequest) {
        return mergeFrom((com.ecommerce.grpc.inventory.CheckInventoryRequest)other);
      } else {
        super.mergeFrom(other);
        return this;
      }
    }

    public Builder mergeFrom(com.ecommerce.grpc.inventory.CheckInventoryRequest other) {
      if (other == com.ecommerce.grpc.inventory.CheckInventoryRequest.getDefaultInstance()) return this;
      if (!other.getProductId().isEmpty()) {
        productId_ = other.productId_;
        onChanged();
      }
      if (other.getQuantity() != 0) {
        setQuantity(other.getQuantity());
      }
      if (other.hasMetadata()) {
        mergeMetadata(other.getMetadata());
      }
      if (other.hasProductInfo()) {
        mergeProductInfo(other.getProductInfo());
      }
      this.mergeUnknownFields(other.unknownFields);
      onChanged();
      return this;
    }

    @java.lang.Override
    public final boolean isInitialized() {
      return true;
    }

    @java.lang.Override
    public Builder mergeFrom(
        com.google.protobuf.CodedInputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws java.io.IOException {
      com.ecommerce.grpc.inventory.CheckInventoryRequest parsedMessage = null;
      try {
        parsedMessage = PARSER.parsePartialFrom(input, extensionRegistry);
      } catch (com.google.protobuf.InvalidProtocolBufferException e) {
        parsedMessage = (com.ecommerce.grpc.inventory.CheckInventoryRequest) e.getUnfinishedMessage();
        throw e.unwrapIOException();
      } finally {
        if (parsedMessage != null) {
          mergeFrom(parsedMessage);
        }
      }
      return this;
    }
    private int bitField0_;

    private java.lang.Object productId_ = "";
    /**
     * <code>string product_id = 1;</code>
     * @return The productId.
     */
    public java.lang.String getProductId() {
      java.lang.Object ref = productId_;
      if (!(ref instanceof java.lang.String)) {
        com.google.protobuf.ByteString bs =
            (com.google.protobuf.ByteString) ref;
        java.lang.String s = bs.toStringUtf8();
        productId_ = s;
        return s;
      } else {
        return (java.lang.String) ref;
      }
    }
    /**
     * <code>string product_id = 1;</code>
     * @return The bytes for productId.
     */
    public com.google.protobuf.ByteString
        getProductIdBytes() {
      java.lang.Object ref = productId_;
      if (ref instanceof String) {
        com.google.protobuf.ByteString b = 
            com.google.protobuf.ByteString.copyFromUtf8(
                (java.lang.String) ref);
        productId_ = b;
        return b;
      } else {
        return (com.google.protobuf.ByteString) ref;
      }
    }
    /**
     * <code>string product_id = 1;</code>
     * @param value The productId to set.
     * @return This builder for chaining.
     */
    public Builder setProductId(
        java.lang.String value) {
      if (value == null) {
    throw new NullPointerException();
  }
  
      productId_ = value;
      onChanged();
      return this;
    }
    /**
     * <code>string product_id = 1;</code>
     * @return This builder for chaining.
     */
    public Builder clearProductId() {
      
      productId_ = getDefaultInstance().getProductId();
      onChanged();
      return this;
    }
    /**
     * <code>string product_id = 1;</code>
     * @param value The bytes for productId to set.
     * @return This builder for chaining.
     */
    public Builder setProductIdBytes(
        com.google.protobuf.ByteString value) {
      if (value == null) {
    throw new NullPointerException();
  }
  checkByteStringIsUtf8(value);
      
      productId_ = value;
      onChanged();
      return this;
    }

    private int quantity_ ;
    /**
     * <code>int32 quantity = 2;</code>
     * @return The quantity.
     */
    @java.lang.Override
    public int getQuantity() {
      return quantity_;
    }
    /**
     * <code>int32 quantity = 2;</code>
     * @param value The quantity to set.
     * @return This builder for chaining.
     */
    public Builder setQuantity(int value) {
      
      quantity_ = value;
      onChanged();
      return this;
    }
    /**
     * <code>int32 quantity = 2;</code>
     * @return This builder for chaining.
     */
    public Builder clearQuantity() {
      
      quantity_ = 0;
      onChanged();
      return this;
    }

    private com.ecommerce.grpc.common.Metadata metadata_;
    private com.google.protobuf.SingleFieldBuilderV3<
        com.ecommerce.grpc.common.Metadata, com.ecommerce.grpc.common.Metadata.Builder, com.ecommerce.grpc.common.MetadataOrBuilder> metadataBuilder_;
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     * @return Whether the metadata field is set.
     */
    public boolean hasMetadata() {
      return metadataBuilder_ != null || metadata_ != null;
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     * @return The metadata.
     */
    public com.ecommerce.grpc.common.Metadata getMetadata() {
      if (metadataBuilder_ == null) {
        return metadata_ == null ? com.ecommerce.grpc.common.Metadata.getDefaultInstance() : metadata_;
      } else {
        return metadataBuilder_.getMessage();
      }
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    public Builder setMetadata(com.ecommerce.grpc.common.Metadata value) {
      if (metadataBuilder_ == null) {
        if (value == null) {
          throw new NullPointerException();
        }
        metadata_ = value;
        onChanged();
      } else {
        metadataBuilder_.setMessage(value);
      }

      return this;
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    public Builder setMetadata(
        com.ecommerce.grpc.common.Metadata.Builder builderForValue) {
      if (metadataBuilder_ == null) {
        metadata_ = builderForValue.build();
        onChanged();
      } else {
        metadataBuilder_.setMessage(builderForValue.build());
      }

      return this;
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    public Builder mergeMetadata(com.ecommerce.grpc.common.Metadata value) {
      if (metadataBuilder_ == null) {
        if (metadata_ != null) {
          metadata_ =
            com.ecommerce.grpc.common.Metadata.newBuilder(metadata_).mergeFrom(value).buildPartial();
        } else {
          metadata_ = value;
        }
        onChanged();
      } else {
        metadataBuilder_.mergeFrom(value);
      }

      return this;
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    public Builder clearMetadata() {
      if (metadataBuilder_ == null) {
        metadata_ = null;
        onChanged();
      } else {
        metadata_ = null;
        metadataBuilder_ = null;
      }

      return this;
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    public com.ecommerce.grpc.common.Metadata.Builder getMetadataBuilder() {
      
      onChanged();
      return getMetadataFieldBuilder().getBuilder();
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    public com.ecommerce.grpc.common.MetadataOrBuilder getMetadataOrBuilder() {
      if (metadataBuilder_ != null) {
        return metadataBuilder_.getMessageOrBuilder();
      } else {
        return metadata_ == null ?
            com.ecommerce.grpc.common.Metadata.getDefaultInstance() : metadata_;
      }
    }
    /**
     * <code>.ecommerce.common.Metadata metadata = 3;</code>
     */
    private com.google.protobuf.SingleFieldBuilderV3<
        com.ecommerce.grpc.common.Metadata, com.ecommerce.grpc.common.Metadata.Builder, com.ecommerce.grpc.common.MetadataOrBuilder> 
        getMetadataFieldBuilder() {
      if (metadataBuilder_ == null) {
        metadataBuilder_ = new com.google.protobuf.SingleFieldBuilderV3<
            com.ecommerce.grpc.common.Metadata, com.ecommerce.grpc.common.Metadata.Builder, com.ecommerce.grpc.common.MetadataOrBuilder>(
                getMetadata(),
                getParentForChildren(),
                isClean());
        metadata_ = null;
      }
      return metadataBuilder_;
    }

    private com.ecommerce.grpc.inventory.ProductInfo productInfo_;
    private com.google.protobuf.SingleFieldBuilderV3<
        com.ecommerce.grpc.inventory.ProductInfo, com.ecommerce.grpc.inventory.ProductInfo.Builder, com.ecommerce.grpc.inventory.ProductInfoOrBuilder> productInfoBuilder_;
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     * @return Whether the productInfo field is set.
     */
    public boolean hasProductInfo() {
      return ((bitField0_ & 0x00000001) != 0);
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     * @return The productInfo.
     */
    public com.ecommerce.grpc.inventory.ProductInfo getProductInfo() {
      if (productInfoBuilder_ == null) {
        return productInfo_ == null ? com.ecommerce.grpc.inventory.ProductInfo.getDefaultInstance() : productInfo_;
      } else {
        return productInfoBuilder_.getMessage();
      }
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    public Builder setProductInfo(com.ecommerce.grpc.inventory.ProductInfo value) {
      if (productInfoBuilder_ == null) {
        if (value == null) {
          throw new NullPointerException();
        }
        productInfo_ = value;
        onChanged();
      } else {
        productInfoBuilder_.setMessage(value);
      }
      bitField0_ |= 0x00000001;
      return this;
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    public Builder setProductInfo(
        com.ecommerce.grpc.inventory.ProductInfo.Builder builderForValue) {
      if (productInfoBuilder_ == null) {
        productInfo_ = builderForValue.build();
        onChanged();
      } else {
        productInfoBuilder_.setMessage(builderForValue.build());
      }
      bitField0_ |= 0x00000001;
      return this;
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    public Builder mergeProductInfo(com.ecommerce.grpc.inventory.ProductInfo value) {
      if (productInfoBuilder_ == null) {
        if (((bitField0_ & 0x00000001) != 0) &&
            productInfo_ != null &&
            productInfo_ != com.ecommerce.grpc.inventory.ProductInfo.getDefaultInstance()) {
          productInfo_ =
            com.ecommerce.grpc.inventory.ProductInfo.newBuilder(productInfo_).mergeFrom(value).buildPartial();
        } else {
          productInfo_ = value;
        }
        onChanged();
      } else {
        productInfoBuilder_.mergeFrom(value);
      }
      bitField0_ |= 0x00000001;
      return this;
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    public Builder clearProductInfo() {
      if (productInfoBuilder_ == null) {
        productInfo_ = null;
        onChanged();
      } else {
        productInfoBuilder_.clear();
      }
      bitField0_ = (bitField0_ & ~0x00000001);
      return this;
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    public com.ecommerce.grpc.inventory.ProductInfo.Builder getProductInfoBuilder() {
      bitField0_ |= 0x00000001;
      onChanged();
      return getProductInfoFieldBuilder().getBuilder();
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    public com.ecommerce.grpc.inventory.ProductInfoOrBuilder getProductInfoOrBuilder() {
      if (productInfoBuilder_ != null) {
        return productInfoBuilder_.getMessageOrBuilder();
      } else {
        return productInfo_ == null ?
            com.ecommerce.grpc.inventory.ProductInfo.getDefaultInstance() : productInfo_;
      }
    }
    /**
     * <code>optional .ecommerce.inventory.ProductInfo product_info = 4;</code>
     */
    private com.google.protobuf.SingleFieldBuilderV3<
        com.ecommerce.grpc.inventory.ProductInfo, com.ecommerce.grpc.inventory.ProductInfo.Builder, com.ecommerce.grpc.inventory.ProductInfoOrBuilder> 
        getProductInfoFieldBuilder() {
      if (productInfoBuilder_ == null) {
        productInfoBuilder_ = new com.google.protobuf.SingleFieldBuilderV3<
            com.ecommerce.grpc.inventory.ProductInfo, com.ecommerce.grpc.inventory.ProductInfo.Builder, com.ecommerce.grpc.inventory.ProductInfoOrBuilder>(
                getProductInfo(),
                getParentForChildren(),
                isClean());
        productInfo_ = null;
      }
      return productInfoBuilder_;
    }
    @java.lang.Override
    public final Builder setUnknownFields(
        final com.google.protobuf.UnknownFieldSet unknownFields) {
      return super.setUnknownFields(unknownFields);
    }

    @java.lang.Override
    public final Builder mergeUnknownFields(
        final com.google.protobuf.UnknownFieldSet unknownFields) {
      return super.mergeUnknownFields(unknownFields);
    }


    // @@protoc_insertion_point(builder_scope:ecommerce.inventory.CheckInventoryRequest)
  }

  // @@protoc_insertion_point(class_scope:ecommerce.inventory.CheckInventoryRequest)
  private static final com.ecommerce.grpc.inventory.CheckInventoryRequest DEFAULT_INSTANCE;
  static {
    DEFAULT_INSTANCE = new com.ecommerce.grpc.inventory.CheckInventoryRequest();
  }

  public static com.ecommerce.grpc.inventory.CheckInventoryRequest getDefaultInstance() {
    return DEFAULT_INSTANCE;
  }

  private static final com.google.protobuf.Parser<CheckInventoryRequest>
      PARSER = new com.google.protobuf.AbstractParser<CheckInventoryRequest>() {
    @java.lang.Override
    public CheckInventoryRequest parsePartialFrom(
        com.google.protobuf.CodedInputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return new CheckInventoryRequest(input, extensionRegistry);
    }
  };

  public static com.google.protobuf.Parser<CheckInventoryRequest> parser() {
    return PARSER;
  }

  @java.lang.Override
  public com.google.protobuf.Parser<CheckInventoryRequest> getParserForType() {
    return PARSER;
  }

  @java.lang.Override
  public com.ecommerce.grpc.inventory.CheckInventoryRequest getDefaultInstanceForType() {
    return DEFAULT_INSTANCE;
  }

}

