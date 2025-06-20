// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: inventory.proto

package com.ecommerce.grpc.inventory;

public interface ProductInfoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:ecommerce.inventory.ProductInfo)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <pre>
   * "available", "out_of_stock", "upcoming", ""
   * </pre>
   *
   * <code>string inventory_status = 1;</code>
   * @return The inventoryStatus.
   */
  java.lang.String getInventoryStatus();
  /**
   * <pre>
   * "available", "out_of_stock", "upcoming", ""
   * </pre>
   *
   * <code>string inventory_status = 1;</code>
   * @return The bytes for inventoryStatus.
   */
  com.google.protobuf.ByteString
      getInventoryStatusBytes();

  /**
   * <code>string name = 2;</code>
   * @return The name.
   */
  java.lang.String getName();
  /**
   * <code>string name = 2;</code>
   * @return The bytes for name.
   */
  com.google.protobuf.ByteString
      getNameBytes();

  /**
   * <code>double price = 3;</code>
   * @return The price.
   */
  double getPrice();
}
