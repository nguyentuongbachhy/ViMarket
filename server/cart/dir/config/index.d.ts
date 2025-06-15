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
    cart: CartConfig;
    pricing: PricingConfig;
    rateLimit: RateLimitConfig;
    security: SecurityConfig;
    logging: LoggingConfig;
    healthCheck: HealthCheckConfig;
}
declare const config: Config;
export { config };
export type { CartConfig, Config, GrpcConfig, JwtConfig, PricingConfig, RedisConfig, ServerConfig };
//# sourceMappingURL=index.d.ts.map