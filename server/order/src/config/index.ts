import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
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
}

interface GrpcConfig {
    inventoryService: GrpcServiceConfig;
    productService: GrpcServiceConfig;
    cartService: GrpcServiceConfig;
    userService: GrpcServiceConfig;
}

interface OrderConfig {
    timeoutMinutes: number;
    reservationTimeoutMinutes: number;
    minOrderAmount: number;
    maxOrderAmount: number;
}

interface ZaloPayConfig {
    appId: string;
    key1: string;
    key2: string;
    endpoint: string;
    queryEndpoint: string;
    callbackUrl: string;
    redirectUrl: string;
    environment: 'sandbox' | 'production';
}

interface Config {
    server: {
        port: number;
        host: string;
        nodeEnv: string;
    };
    database: DatabaseConfig;
    jwt: JwtConfig;
    grpc: GrpcConfig;
    order: OrderConfig;
    logging: {
        level: string;
        format: string;
    };
    zaloPay: ZaloPayConfig;
    cors: {
        origins: string[];
    };
}




function getEnvVar(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

function getEnvNumber(name: string, defaultValue: number): number {
    const value = process.env[name];
    return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];
    return value ? value.toLowerCase() === 'true' : defaultValue;
}

export const config: Config = {
    server: {
        port: getEnvNumber('PORT', 8004),
        host: getEnvVar('HOST', '0.0.0.0'),
        nodeEnv: getEnvVar('NODE_ENV', 'development'),
    },
    database: {
        host: getEnvVar('DB_HOST', 'localhost'),
        port: getEnvNumber('DB_PORT', 5442),
        database: getEnvVar('DB_NAME', 'ecommerce_orders'),
        user: getEnvVar('DB_USER', 'spring'),
        password: getEnvVar('DB_PASSWORD', 'spring'),
        ssl: getEnvBoolean('DB_SSL_MODE', false),
        maxConnections: getEnvNumber('DB_MAX_CONNECTIONS', 20),
    },
    jwt: {
        secretKey: getEnvVar('JWT_SECRET_KEY', ''),
        algorithm: getEnvVar('JWT_ALGORITHM', 'HS512'),
        expirationSeconds: getEnvNumber('JWT_EXPIRATION_SECONDS', 86400),
        issuer: getEnvVar('JWT_ISSUER', 'ecommerce-api'),
        audience: getEnvVar('JWT_AUDIENCE', 'ecommerce-clients'),
    },
    grpc: {
        productService: {
            host: getEnvVar('GRPC_HOST', 'localhost'),
            port: getEnvNumber('PRODUCT_GRPC_PORT', 50053),
            timeout: getEnvNumber('GRPC_TIMEOUT', 30000),
            maxRetries: getEnvNumber('GRPC_MAX_RETRIES', 3),
        },
        inventoryService: {
            host: getEnvVar('GRPC_HOST', 'localhost'),
            port: getEnvNumber('INVENTORY_GRPC_PORT', 50054),
            timeout: getEnvNumber('GRPC_TIMEOUT', 30000),
            maxRetries: getEnvNumber('GRPC_MAX_RETRIES', 3),
        },
        cartService: {
            host: getEnvVar('GRPC_HOST', 'localhost'),
            port: getEnvNumber('CART_GRPC_PORT', 50055),
            timeout: getEnvNumber('GRPC_TIMEOUT', 30000),
            maxRetries: getEnvNumber('GRPC_MAX_RETRIES', 3),
        },
        userService: {
            host: getEnvVar('GRPC_HOST', 'localhost'),
            port: getEnvNumber('USER_GRPC_PORT', 50056),
            timeout: getEnvNumber('GRPC_TIMEOUT', 30000),
            maxRetries: getEnvNumber('GRPC_MAX_RETRIES', 3),
        }
    },
    order: {
        timeoutMinutes: getEnvNumber('ORDER_TIMEOUT_MINUTES', 30),
        reservationTimeoutMinutes: getEnvNumber('RESERVATION_TIMEOUT_MINUTES', 15),
        minOrderAmount: getEnvNumber('MIN_ORDER_AMOUNT', 1),
        maxOrderAmount: getEnvNumber('MAX_ORDER_AMOUNT', 100000),
    },
    logging: {
        level: getEnvVar('LOG_LEVEL', 'info'),
        format: getEnvVar('LOG_FORMAT', 'json'),
    },
    zaloPay: {
        appId: getEnvVar('ZALOPAY_APP_ID', '2553'),
        key1: getEnvVar('ZALOPAY_KEY1', 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'),
        key2: getEnvVar('ZALOPAY_KEY2', 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz'),
        endpoint: getEnvVar('ZALOPAY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/create'),
        queryEndpoint: getEnvVar('ZALOPAY_QUERY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/query'),
        callbackUrl: getEnvVar('ZALOPAY_CALLBACK_URL', 'https://your-domain.com/api/v1/payments/zalopay/callback'),
        redirectUrl: getEnvVar('ZALOPAY_REDIRECT_URL', 'https://your-frontend.com/payment/success'),
        environment: getEnvVar('ZALOPAY_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'
    },
    cors: {
        origins: getEnvVar('CORS_ORIGINS', 'http://localhost:5173').split(','),
    },
};

// Validation
if (!config.jwt.secretKey) {
    throw new Error('JWT_SECRET_KEY is required');
}

if (config.jwt.secretKey.length < 32) {
    throw new Error('JWT_SECRET_KEY must be at least 32 characters long');
}