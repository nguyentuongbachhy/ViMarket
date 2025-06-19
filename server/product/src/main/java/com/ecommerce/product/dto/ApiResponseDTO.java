package com.ecommerce.product.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponseDTO<T> {
    @Builder.Default
    private String status = "success";

    @Builder.Default
    private int code = 200;

    private String message;
    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private Object meta;

    // Factory methods
    public static <T> ApiResponseDTO<T> success(T data) {
        return ApiResponseDTO.<T>builder()
                .status("success")
                .code(200)
                .message("Operation completed successfully")
                .data(data)
                .build();
    }

    public static <T> ApiResponseDTO<T> success(T data, String message) {
        return ApiResponseDTO.<T>builder()
                .status("success")
                .code(200)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponseDTO<T> success(T data, String message, Object meta) {
        return ApiResponseDTO.<T>builder()
                .status("success")
                .code(200)
                .message(message)
                .data(data)
                .meta(meta)
                .build();
    }

    public static <T> ApiResponseDTO<T> error(int code, String message) {
        return ApiResponseDTO.<T>builder()
                .status("error")
                .code(code)
                .message(message)
                .build();
    }

    public static <T> ApiResponseDTO<T> error(int code, String message, Object meta) {
        return ApiResponseDTO.<T>builder()
                .status("error")
                .code(code)
                .message(message)
                .meta(meta)
                .build();
    }
}