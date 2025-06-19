package com.ecommerce.product.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.ecommerce.product.dto.ApiResponseDTO;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {

        log.error("Resource not found exception: {}", ex.getMessage());

        ApiResponseDTO<Void> response = ApiResponseDTO.<Void>builder()
                .status("error")
                .code(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage())
                .meta(Map.of("path", request.getRequestURI()))
                .build();

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {

        log.error("Access denied exception: {}", ex.getMessage());

        ApiResponseDTO<Void> response = ApiResponseDTO.<Void>builder()
                .status("error")
                .code(HttpStatus.FORBIDDEN.value())
                .message("You don't have permission to access this resource")
                .meta(Map.of("path", request.getRequestURI()))
                .build();

        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> meta = new HashMap<>();
        meta.put("path", request.getRequestURI());
        meta.put("errors", errors);

        ApiResponseDTO<Void> response = ApiResponseDTO.<Void>builder()
                .status("error")
                .code(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .meta(meta)
                .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleGlobalException(
            Exception ex, HttpServletRequest request) {

        log.error("Unhandled exception: ", ex);

        ApiResponseDTO<Void> response = ApiResponseDTO.<Void>builder()
                .status("error")
                .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("An unexpected error occurred")
                .meta(Map.of("path", request.getRequestURI()))
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ProductServiceException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleProductServiceException(
            ProductServiceException ex, HttpServletRequest request) {

        log.error("Product service exception: {}", ex.getMessage());

        ApiResponseDTO<Void> response = ApiResponseDTO.<Void>builder()
                .status("error")
                .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message(ex.getMessage())
                .meta(Map.of("path", request.getRequestURI()))
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}