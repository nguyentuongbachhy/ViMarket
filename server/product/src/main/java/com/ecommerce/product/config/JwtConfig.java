package com.ecommerce.product.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    private String secretKey;
    private String algorithm;
    private long expirationSeconds;
    private String issuer;
    private String audience;
}