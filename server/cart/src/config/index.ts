require('dotenv').config();

interface ServerConfig {
    port: number;
    nodeEnv: string;
    host: string;
}

interface RedisConfig {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
}

interface JwtConfig {
    secretKey: string;
    algorithm: string;
    expirationSeconds: number;
    issuer: string;
    audience: string;
}

interface GrpcServiceConfig {
    host: string;
    port: number;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
}

interface GrpcServerConfig {
    port: number;
    host: string;
}

interface GrpcConfig {
    productService: GrpcServiceConfig;
    inventoryService: GrpcServiceConfig;
    server: GrpcServerConfig;
}

interface CartConfig {
    expirationDays: number;
    maxItems: number;
    reservationTimeoutMinutes: number;
    maxQuantityPerItem: number;
    minOrderAmount: number;
}

interface PricingConfig {
    taxRate: number;
    shippingCost: number;
    freeShippingThreshold: number;
    currency: string;
    decimalPlaces: number;
}

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    cartWindowMs: number;
    cartMaxRequests: number;
}

interface SecurityConfig {
    corsOrigins: string[];
    trustProxy: boolean;
    helmet: {
        contentSecurityPolicy: boolean;
        hsts: boolean;
    };
}

interface LoggingConfig {
    level: string;
    format: string;
    enableRequestLogging: boolean;
    enablePerformanceLogging: boolean;
}

interface HealthCheckConfig {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
}

interface Config {
    server: ServerConfig;
    redis: RedisConfig;
    jwt: JwtConfig;
    grpc: GrpcConfig;
    kafka: {
        clientId: string;
        brokers: string[];
        topics: {
            cartExpiration: string;
        };
    };
    cart: CartConfig;
    pricing: PricingConfig;
    rateLimit: RateLimitConfig;
    security: SecurityConfig;
    logging: LoggingConfig;
    healthCheck: HealthCheckConfig;
}

// Helper function to get required environment variable
function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}

// Helper function to get optional environment variable with default
function getEnvVar(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

// Helper function to get number environment variable
function getEnvNumber(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsed;
}

// Helper function to get float environment variable
function getEnvFloat(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (!value) return defaultValue;

    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsed;
}

// Helper function to get boolean environment variable
function getEnvBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];
    if (!value) return defaultValue;

    return value.toLowerCase() === 'true';
}

// Helper function to get array environment variable
function getEnvArray(name: string, defaultValue: string[]): string[] {
    const value = process.env[name];
    if (!value) return defaultValue;

    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

const config: Config = {
    server: {
        port: getEnvNumber('PORT', 8002),
        nodeEnv: getEnvVar('NODE_ENV', 'development'),
        host: getEnvVar('HOST', '0.0.0.0'),
    },

    redis: {
        host: getEnvVar('REDIS_HOST', 'localhost'),
        port: getEnvNumber('REDIS_PORT', 6380),
        password: getEnvVar('REDIS_PASSWORD', ''),
        db: getEnvNumber('REDIS_DB', 0),
        keyPrefix: getEnvVar('REDIS_KEY_PREFIX', 'ecommerce:'),
        maxRetriesPerRequest: getEnvNumber('REDIS_MAX_RETRIES', 3),
        lazyConnect: getEnvBoolean('REDIS_LAZY_CONNECT', true),
        keepAlive: getEnvNumber('REDIS_KEEP_ALIVE', 30000),
        family: getEnvNumber('REDIS_FAMILY', 4),
    },

    jwt: {
        secretKey: getRequiredEnvVar('JWT_SECRET_KEY'),
        algorithm: getEnvVar('JWT_ALGORITHM', 'HS512'),
        expirationSeconds: getEnvNumber('JWT_EXPIRATION_SECONDS', 86400),
        issuer: getEnvVar('JWT_ISSUER', 'ecommerce-api'),
        audience: getEnvVar('JWT_AUDIENCE', 'ecommerce-clients'),
    },

    grpc: {
        productService: {
            host: getEnvVar('PRODUCT_GRPC_HOST', 'localhost'),
            port: getEnvNumber('PRODUCT_GRPC_PORT', 50053),
            timeout: getEnvNumber('PRODUCT_GRPC_TIMEOUT', 30000),
            maxRetries: getEnvNumber('PRODUCT_GRPC_MAX_RETRIES', 3),
            retryDelay: getEnvNumber('PRODUCT_GRPC_RETRY_DELAY', 1000),
        },
        inventoryService: {
            host: getEnvVar('INVENTORY_GRPC_HOST', 'localhost'),
            port: getEnvNumber('INVENTORY_GRPC_PORT', 50054),
            timeout: getEnvNumber('INVENTORY_GRPC_TIMEOUT', 30000),
            maxRetries: getEnvNumber('INVENTORY_GRPC_MAX_RETRIES', 3),
            retryDelay: getEnvNumber('INVENTORY_GRPC_RETRY_DELAY', 1000),
        },
        server: {
            host: getEnvVar('GRPC_SERVER_HOST', 'localhost'),
            port: getEnvNumber('GRPC_SERVER_PORT', 50055)
        }
    },

    kafka: {
        clientId: getEnvVar('KAFKA_CLIENT_ID', 'cart-service'),
        brokers: getEnvVar('KAFKA_BROKERS', 'localhost:9092').split(','),
        topics: {
            cartExpiration: getEnvVar('KAFKA_TOPIC_CART_EXPIRATION', 'cart.expiration.reminder'),
        },
    },

    cart: {
        expirationDays: getEnvNumber('CART_EXPIRATION_DAYS', 30),
        maxItems: getEnvNumber('MAX_CART_ITEMS', 100),
        reservationTimeoutMinutes: getEnvNumber('CART_RESERVATION_TIMEOUT_MINUTES', 15),
        maxQuantityPerItem: getEnvNumber('MAX_QUANTITY_PER_ITEM', 10),
        minOrderAmount: getEnvFloat('MIN_ORDER_AMOUNT', 10.0),
    },

    pricing: {
        taxRate: getEnvFloat('TAX_RATE', 0.1),
        shippingCost: getEnvFloat('SHIPPING_COST', 10.0),
        freeShippingThreshold: getEnvFloat('FREE_SHIPPING_THRESHOLD', 100.0),
        currency: getEnvVar('CURRENCY', 'VND'),
        decimalPlaces: getEnvNumber('DECIMAL_PLACES', 2),
    },

    rateLimit: {
        windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
        maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
        cartWindowMs: getEnvNumber('CART_RATE_LIMIT_WINDOW_MS', 60000),
        cartMaxRequests: getEnvNumber('CART_RATE_LIMIT_MAX_REQUESTS', 30),
    },

    security: {
        corsOrigins: getEnvArray('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']),
        trustProxy: getEnvBoolean('TRUST_PROXY', true),
        helmet: {
            contentSecurityPolicy: getEnvBoolean('HELMET_CSP', true),
            hsts: getEnvBoolean('HELMET_HSTS', true),
        },
    },

    logging: {
        level: getEnvVar('LOG_LEVEL', 'info'),
        format: getEnvVar('LOG_FORMAT', 'json'),
        enableRequestLogging: getEnvBoolean('ENABLE_REQUEST_LOGGING', true),
        enablePerformanceLogging: getEnvBoolean('ENABLE_PERFORMANCE_LOGGING', true),
    },

    healthCheck: {
        enabled: getEnvBoolean('HEALTH_CHECK_ENABLED', true),
        interval: getEnvNumber('HEALTH_CHECK_INTERVAL', 30000),
        timeout: getEnvNumber('HEALTH_CHECK_TIMEOUT', 10000),
        retries: getEnvNumber('HEALTH_CHECK_RETRIES', 3),
    },
};

// Validation function (simplified)
function validateConfig(): void {
    const errors: string[] = [];

    if (config.server.port <= 0 || config.server.port > 65535) {
        errors.push('Server port must be between 1 and 65535');
    }

    if (config.jwt.secretKey.length < 32) {
        errors.push('JWT secret key must be at least 32 characters long');
    }

    if (config.cart.maxItems <= 0) {
        errors.push('Max cart items must be greater than 0');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
}

validateConfig();

export { config };
export type { CartConfig, Config, GrpcConfig, JwtConfig, PricingConfig, RedisConfig, ServerConfig };

