require('dotenv').config()

export const config = {
    server: {
        port: parseInt(process.env.PORT || '8084', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
        host: process.env.HOST || '0.0.0.0',
    },
    jwt: {
        secretKey: process.env.JWT_SECRET_KEY!,
        algorithm: process.env.JWT_ALGORITHM || 'HS512',
        expirationSeconds: parseInt(process.env.JWT_EXPIRATION_SECONDS || '86400', 10),
        issuer: process.env.JWT_ISSUER || 'ecommerce-api',
        audience: process.env.JWT_AUDIENCE || 'ecommerce-clients',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6381', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://spring:spring@localhost:5436/wishlist_db',
    },
    grpc: {
        productService: {
            host: process.env.PRODUCT_GRPC_HOST || 'localhost',
            port: parseInt(process.env.PRODUCT_GRPC_PORT || '50053', 10),
            timeout: parseInt(process.env.PRODUCT_GRPC_TIMEOUT || '30000', 10),
            maxRetries: parseInt(process.env.PRODUCT_GRPC_MAX_RETRIES || '3', 10),
            retryDelay: parseInt(process.env.PRODUCT_GRPC_RETRY_DELAY || '1000', 10),
        },
    },
    wishlist: {
        maxItems: parseInt(process.env.MAX_WISHLIST_ITEMS || '500', 10),
        cacheExpiration: parseInt(process.env.WISHLIST_CACHE_EXPIRATION || '3600', 10), // 1 hour
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
        wishlist: {
            windowMs: parseInt(process.env.WISHLIST_RATE_LIMIT_WINDOW_MS || '60000', 10),
            maxRequests: parseInt(process.env.WISHLIST_RATE_LIMIT_MAX_REQUESTS || '100', 10),
        },
    },
    security: {
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
        trustProxy: process.env.TRUST_PROXY === 'true',
        helmetCSP: process.env.HELMET_CSP === 'true',
        helmetHSTS: process.env.HELMET_HSTS === 'true',
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
        enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING === 'true',
    },
    healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '10000', 10),
        retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3', 10),
    },
} as const;

const requiredEnvVars = ['JWT_SECRET_KEY', 'DATABASE_URL']
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is missing`)
    }
}

// Log config for debugging (mask sensitive data)
console.log('Wishlist Service Config loaded:', {
    server: config.server,
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        hasPassword: !!config.redis.password,
        db: config.redis.db,
    },
    database: {
        url: config.database.url.replace(/:[^:]*@/, ':***@'),
    },
    grpc: {
        productService: {
            host: config.grpc.productService.host,
            port: config.grpc.productService.port,
        },
    },
    wishlist: config.wishlist,
    rateLimit: config.rateLimit,
    security: {
        corsOrigins: config.security.corsOrigins,
        trustProxy: config.security.trustProxy,
    },
});