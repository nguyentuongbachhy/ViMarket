"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.CONFIG = {
    PORT: parseInt(process.env.PORT || '8084'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://spring:spring@localhost:5436/wishlist_db',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6381'),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'spring',
    JWT_SECRET: process.env.JWT_SECRET_KEY || 'jYNKRd9KDzX+IG+6KWz31IXr+QX5GAQ1Svr3LWkzUSP3DpjKm4zsrlbf8B9b14EH',
    JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS512',
    JWT_ISSUER: process.env.JWT_ISSUER || 'ecommerce-api',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'ecommerce-clients',
    GRPC_PRODUCT_SERVICE_URL: process.env.GRPC_PRODUCT_SERVICE_URL || 'localhost:50053',
    KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'wishlist-service',
    KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'wishlist-service-group',
    KAFKA_TOPICS: {
        WISHLIST_PRICE_REQUEST: process.env.KAFKA_TOPIC_WISHLIST_PRICE_REQUEST || 'wishlist.price.request',
        PRODUCT_PRICE_RESPONSE: process.env.KAFKA_TOPIC_PRODUCT_PRICE_RESPONSE || 'product.price.response',
    }
};
//# sourceMappingURL=index.js.map